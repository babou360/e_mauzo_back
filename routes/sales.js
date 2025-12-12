const express = require('express')
const router = express.Router()
const { Sales, User, Product, Buyer } = require('../models/index')
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
  const { products, buyer_id, discount, business_id, buyer_name, buyer_phone, isPaid, payment_method } = req.body;
  const user = req.user;
  try {
    // ✅ validations
    if (!Array.isArray(products) || products.length < 1) {
      return res.status(400).json({ error: "product list cannot be empty" });
    } else if (!business_id) {
      return res.status(400).json({ error: "business id is required" });
    } else if (typeof isPaid !== "boolean") {
      return res.status(400).json({ error: "payment status is required" });
    } else if ((buyer_name && !buyer_phone) || (!buyer_name && buyer_phone)) {
      return res.status(400).json({ error: "Both buyer name and buyer phone are required if one is provided" });
    } else {
      // ✅ calculate total price
      const totalSelling = products.reduce((acc, p) => acc + ((p.selling_price || 0) * (p.quantity || 0)), 0);

      let sale;

      if ((buyer_name?.trim() || buyer_phone?.trim())) {
        // find existing buyer
        let buyer = await Buyer.findOne({
          where: { phone: buyer_phone }
        });

        if (!buyer) {
          buyer = await Buyer.create({
            name: buyer_name?.trim() || "",
            phone: buyer_phone?.trim() || "",
            business_id
          });
        }

        sale = await Sales.create({
          products,
          buyer_id: buyer.id,
          discount,
          seller_id: user.phone,
          total_price: totalSelling,
          business_id: business_id,
          paid: isPaid,
          payment_method
        });
      } else {
        // use provided buyer_id (if any)
        sale = await Sales.create({
          products,
          buyer_id,
          discount,
          seller_id: user.phone,
          total_price: totalSelling,
          business_id: business_id,
          paid: isPaid,
          payment_method
        });
      }

      // ✅ update product stock
      const productas = await Product.findAll({
        where: {
          id: {
            [Op.in]: products.map(item => item.id),
          },
        },
      });

      if (productas && productas.length > 0) {
        for (const dbProduct of productas) {
          const matchingProduct = products.find(p => p.id === dbProduct.id);
          if (matchingProduct) {
            const newQuantity = dbProduct.quantity - matchingProduct.quantity;
            await dbProduct.update({
              quantity: newQuantity >= 0 ? newQuantity : 0,
            });
          }
        }
      }

      return res.json(sale);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

router.get('/get_sales', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const business_id = req.query.business_id;
  const seller_id = req.query.seller_id;
  const { duration = 'all', start, end } = req.query;
  const paymentFilter = req.query.payment_filter

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
      status: "active",
      createdAt: { [Op.between]: [startTime, endTime] }
    };

    // Add seller_id filter if provided and not 'all'
    if (seller_id && seller_id !== 'all') {
      whereClause.seller_id = seller_id;
    }
    // Add seller_id filter if provided and not 'all'
    if (paymentFilter && paymentFilter !== 'all') {
      whereClause.paid = paymentFilter === "cash" ? true : false;
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
        const buyer = await Buyer.findOne({
          where: { id: item.buyer_id }
        })
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
          buyer: buyer,
          createdAt: item.createdAt,
          discount: item.discount,
          id: item.id,
          products: item.products,
          seller: user ? user.name : null,
          total_price: item.total_price,
          sale_total: saleSellingTotal,
          sale_profit: saleSellingTotal - saleBuyingTotal,
          paid: item.paid,
          payment_method: item.payment_method
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
    res.status(500).json({ error: 'internal server error'});
  }
});

// get inactive sales
router.get('/get_inactive_sales', async(req,res)=> {
  const {business_id} = req.query
  try{
    const sales = await Sales.findAll({
      where: {
        business_id,
        status: 'inactive'
      }
    })
    res.json(sales)
  }catch(error){
    res.status(500).json({ error: 'internal server error'});
  }
})

// change payment status
router.post('/change_payment_status', async (req, res) => {
  const id = req.body.id
  try {
    const sale = await Sales.findOne({
      where: { id }
    })
    if (sale) {
      sale.update({
        paid: true
      })
      res.json(sale)
    } else {
      return res.status(400).json({ error: `sale with id ${id} does not exist` })
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
})

// enable/disable sale
router.post('/enable_disable', async (req, res) => {
  const id = req.body.id
  try {
    const sale = await Sales.findOne({
      where: { id }
    })
    if (sale) {
      sale.update({
        status: sale.status=="active"?"inactive":"active"
      })
      res.json(sale)
    } else {
      return res.status(400).json({ error: `sale with id ${id} does not exist` })
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
})

module.exports = router