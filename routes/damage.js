const express = require('express')
const router = express.Router()
const {Damage,Product} = require('../models/index')
const { uploadFiles } = require("./uploadService");
const authMiddleware = require('../utils/authMiddleware');
const {Op} = require('sequelize')


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
// register_damage
router.post('/register_damage',authMiddleware, async (req,res) => {
    const {product_id,images,quantity,reason,business_id} = req.body
    const user = req.user
    try{
        if(!product_id){
            return res.status(400).json({error: "product id is required"})
        } else if(!business_id){
            return res.status(400).json({error: "business id is required"})
        }else if (!images || images.length < 1){
          return res.status(400).json({error: "images are required"})  
        }else if (!quantity){
          return res.status(400).json({error: "quantity is required"})  
        }else{
            const product = await Product.findOne({
                where: {
                    id: product_id
                }
            })
            if(!product){
              return res.status(400).json({error: `product with id ${product_id} was not found`})  
            }else{
             const uploadedFiles = await uploadFiles(images);
             if(uploadedFiles.length>0){
                const damages = await Damage.create({
                    product_id: product_id,
                    name: product.name,
                    images: uploadedFiles,
                    selling_price: product.selling_price,
                    buying_price: product.buying_price,
                    quantity,
                    reason,
                    attendant_id: user.phone,
                    business_id
                })
                res.json(damages)
             }else{
                return res.status(400).json({error: "an error occured while uploading files"})
             }
            }
        }
    }catch(error){
        res.status(500).json({error: "internal server error"})
    }
})

// get damages
// get damages
router.get('/get_damages', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const business_id = req.query.business_id;
  const { duration = 'all', start, end } = req.query;
  const user = req.user;
  try {
    if (!business_id) {
      return res.status(400).json({ error: "business_id is required" });
    }

    const { start: rangeStart, end: rangeEnd } = getDateRange(duration, start, end);

    const whereClause = {
      business_id,
      attendant_id: user.phone,
      createdAt: { [Op.between]: [rangeStart, rangeEnd] }
    };

    // Get all damages (for totals)
    const allDamages = await Damage.findAll({ where: whereClause });

    // Correct totalDamageCost calculation
    const totalDamageCost = allDamages.reduce((acc, dmg) => {
      return acc + (dmg.quantity * dmg.buying_price);
    }, 0);

    // Get paginated damages
    const paginatedDamages = await Damage.findAndCountAll({
      offset,
      limit: pageSize,
      order: [['id', 'DESC']],
      where: whereClause
    });

    const result = paginatedDamages.rows.map(item => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      reason: item.reason,
      quantity: item.quantity,
      images: item.images,
      buying_price: item.buying_price,
      selling_price: item.selling_price,
    }));
    res.json({
      rows: result,
      count: paginatedDamages.count,
      totalPages: Math.ceil(paginatedDamages.count / pageSize),
      all: allDamages,
      totals: {
        total_damage: totalDamageCost
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
});


module.exports = router