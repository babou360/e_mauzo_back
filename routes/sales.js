const express = require('express')
const router = express.Router()
const { Sales, User, Product } = require('../models/index')
const authMiddleware = require('../utils/authMiddleware')
const { Op } = require('sequelize')


function getDateRange(duration, start_date, end_date) {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (duration.toLowerCase()) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (start_date && end_date) {
        let start = new Date(start_date);
        let end = new Date(end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      } else if (start_date) {
        let start = new Date(start_date);
        start.setHours(0, 0, 0, 0);
        return { start, end: start };
      } else if (end_date) {
        let end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        return { start: end, end };
      }
      throw new Error("Custom range requires at least one of start_date or end_date.");
    case 'all':
    default:
      return { start: new Date(0), end: new Date() };
  }

  return { start, end };
}

router.post('/sale', authMiddleware, async (req, res) => {
  const { products, buyer_id, discount, business_id } = req.body
  const user = req.user
  console.log('the user is ',products)
  try {
    if (products.length < 1) {
      return res.status(400).json({ error: "product list cannot be empty" })
    } else if (!business_id) {
      return res.status(400).json({ error: "business id is required" })
    } else {
      const totalSelling = products.reduce((acc, p) => acc + (p.selling_price * p.quantity), 0);
      const sale = await Sales.create({
        products,
        buyer_id,
        discount,
        seller_id: user.phone,
        total_price: totalSelling,
        business_id: business_id
      })
      const productas = await Product.findAll({
        where: {
          id: {
            [Op.in]: products.map(item => item.id),
          },
        },
      });

      // If products found, update quantities
      if (productas) {
        for (const dbProduct of productas) {
          const matchingProduct = products.find(p => p.id === dbProduct.id);
          if (matchingProduct) {
            // Assuming you want to subtract the quantity
            const newQuantity = dbProduct.quantity - matchingProduct.quantity;

            await dbProduct.update({
              quantity: newQuantity >= 0 ? newQuantity : 0,
            });
          }
        }
      }
      res.json(sale)
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error })
  }
})

// get sales
// router.get('/get_sales', async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   const offset = (page - 1) * pageSize;
//   const business_id = req.query.business_id;
//   const seller_id = req.query.seller_id;

//   try {
//     const sales = await Sales.findAndCountAll({
//       offset,
//       limit: pageSize,
//       order: [['id', 'DESC']],
//       where: {
//         business_id: business_id
//       }
//     });

//     const result = await Promise.all(
//       sales.rows.map(async (item) => {
//         const user = await User.findOne({
//           where: {
//             phone: item.seller_id   // or fix this condition as needed
//           }
//         });
//         return {
//           business_id: item.business_id,
//           buyer_id: item.buyer_id,
//           createdAt: item.createdAt,
//           discount: item.discount,
//           id: item.id,
//           products: item.products,
//           seller_id: user ? user.name : null, // or other relevant field
//           total_price: item.total_price
//         };
//       })
//     );

//     res.json({
//       count: sales.count,
//       rows: result
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.toString() });
//   }
// });

router.get('/get_sales', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const business_id = req.query.business_id;
  const seller_id = req.query.seller_id;
  const { duration = 'all', start, end } = req.query;

  try {
    // Validate business_id
    if (!business_id) {
      return res.status(400).json({ error: "business_id is required" });
    }

    // Get date range based on duration
    const { start: rangeStart, end: rangeEnd } = getDateRange(duration, start, end);
    
    // Set time range (full days)
    const startTime = new Date(rangeStart);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(rangeEnd);
    endTime.setHours(23, 59, 59, 999);

    // Build where clause
    const whereClause = {
      business_id: business_id,
      createdAt: { [Op.between]: [startTime, endTime] }
    };

    // Add seller_id filter if provided and not 'all'
    if (seller_id && seller_id !== 'all') {
      whereClause.seller_id = seller_id;
    }

    // FIRST: Get ALL sales (without pagination) to calculate totals
    const allSales = await Sales.findAll({
      where: whereClause
    });

    // Calculate totals across ALL sales
    let totalSellingPrice = 0;
    let totalBuyingPrice = 0;

    allSales.forEach(sale => {
      if (sale.products && sale.products.length > 0) {
        sale.products.forEach(product => {
          totalSellingPrice += (product.quantity * product.selling_price);
          totalBuyingPrice += (product.quantity * product.buying_price);
        });
      }
    });

    const netProfit = totalSellingPrice - totalBuyingPrice;

    // SECOND: Get paginated sales for the current page
    const paginatedSales = await Sales.findAndCountAll({
      offset,
      limit: pageSize,
      order: [['id', 'DESC']],
      where: whereClause
    });

    // Get all sales count for the same filters
    const allSalesCount = await Sales.count({
      where: whereClause
    });

    // Map paginated sales data with user information
    const result = await Promise.all(
      paginatedSales.rows.map(async (item) => {
        const user = await User.findOne({
          where: {
            phone: item.seller_id
          }
        });

        // Calculate sale-level totals (for display in table)
        let saleSellingTotal = 0;
        let saleBuyingTotal = 0;
        
        if (item.products && item.products.length > 0) {
          item.products.forEach(product => {
            saleSellingTotal += (product.quantity * product.selling_price);
            saleBuyingTotal += (product.quantity * product.buying_price);
          });
        }

        return {
          business_id: item.business_id,
          buyer_id: item.buyer_id,
          createdAt: item.createdAt,
          discount: item.discount,
          id: item.id,
          products: item.products,
          seller_id: user ? user.name : null,
          total_price: item.total_price,
          sale_total: saleSellingTotal,
          sale_profit: saleSellingTotal - saleBuyingTotal
        };
      })
    );

    res.json({
      rows: result,
      all: allSalesCount,
      count: paginatedSales.count,
      totalPages: Math.ceil(paginatedSales.count / pageSize),
      totals: {
        total_selling: totalSellingPrice,    // From ALL sales matching filters
        total_buying: totalBuyingPrice,      // From ALL sales matching filters
        net_profit: netProfit                // From ALL sales matching filters
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router