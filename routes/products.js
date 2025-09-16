const express = require('express')
const router = express.Router()
const { Product,Stock } = require('../models/index')
const { Op } = require('sequelize')
const authMiddleware = require('../utils/authMiddleware')
const { uploadFiles } = require("./uploadService");


async function createStock (user_id,quantity,selling_price,buying_price,name){
await Stock.create({
    user_id,
    quantity,
    selling_price,
    buying_price,
    name
})
}

router.post('/create_product',authMiddleware, async (req, res) => {
    const { name, images, quantity, selling_price, buying_price, category, measurement, description, business_id, min_stock,business_type,brand,pack_size,expire_date } = req.body
    const user = req.user
    console.log(req.body)
    try {
        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Product name is required" });
        }if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Product name is required" });
        } else if (quantity === undefined || isNaN(quantity) || !Number.isInteger(Number(quantity))) {
            return res.status(400).json({ error: "Quantity must be an integer" });
        } else if (selling_price === undefined || isNaN(selling_price)) {
            return res.status(400).json({ error: "Selling price must be a valid number" });
        } else if (buying_price === undefined || isNaN(buying_price)) {
            return res.status(400).json({ error: "Buying price must be a valid number" });
        } else if (!category || category.trim() === "") {
            return res.status(400).json({ error: "Category is required" });
        } else if (!measurement || measurement.keys?.length === 0) {
            return res.status(400).json({ error: "Measurement is required" });
        } else if (!business_id) {
            return res.status(400).json({ error: "Business ID is required" });
        } else {
            const urls = await uploadFiles(images);
            const product = await Product.create({
                attendant_id: user.phone,
                name,
                business_id,
                images: urls,
                quantity,
                selling_price,
                buying_price,
                category,
                measurement,
                description,
                min_stock,
                business_type,
                brand,
                pack_size,
                expire_date
            })
            res.json(product)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error })
    }
})

// add stock
router.post('/add_stock',authMiddleware, async(req,res) => {
    const {product_id,new_selling,new_buying,new_quantity} = req.body
    const user = req.user
    try{
        if(!product_id){
            return res.status(400).json({error: "product id is required"})
        }else{
            const product = await Product.findOne({
                where: {id: product_id}
            })
            if(product){
                if(product.selling_price===Number(new_selling) && product.buying_price===Number(new_buying)){
                    product.update({
                        quantity: product.quantity+Number(new_quantity)
                    })
                    createStock(user.id,new_quantity,new_selling,new_buying,product.name)
                    res.json(product)
                }else if((product.selling_price!==new_selling || product.buying_price!==new_buying) && product.quantity===0){
                  product.update({
                        quantity: new_quantity,
                        buying_price: new_buying,
                        selling_price: new_selling
                    }) 
                    createStock(user.id,new_quantity,new_selling,new_buying,product.name) 
                    res.json(product)
                }else if((product.selling_price!==new_selling || product.buying_price!==new_buying) && product.quantity > 0){
                    product.update({
                        new_quantity: new_quantity,
                        new_buying_price: new_buying,
                        new_selling_price: new_selling
                    })
                    createStock(user.id,new_quantity,new_selling,new_buying,product.name)
                    res.json(product)
                }
            }else{
                return res.status(400).json({error: "product not found"})
            }
        }
    }catch(error){

    }
})

// get products
router.get('/get_products', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const offset = (page - 1) * pageSize;
    const name = req.query.name
    const business_id = req.query.business_id
    console.log('products business id is ',business_id)
    
    const whereClause = {};

    try {
        if (name) {
    whereClause.name = {
        [Op.iLike]: `%${name}%`  // for partial match, optional
    };
    }else{
        whereClause.business_id = {
            [Op.eq]: business_id
        }
    }
        const curr = await Product.findAndCountAll({
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']],
            ...(Object.keys(whereClause).length && { where: whereClause })
        })
        const all = await Product.findAll({
            where: {
                business_id
            }
        })
        res.json({
            data: curr.rows,
            all: all,
            totalItems: curr.count,
            totalPages: Math.ceil(curr.count / pageSize),
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router