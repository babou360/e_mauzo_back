const express = require('express');
const router = express.Router();
const { Product, Stock } = require('../models/index');
const { Op } = require('sequelize');
const authMiddleware = require('../utils/authMiddleware');
const multer = require('multer');
const { uploadFiles } = require('./uploadService');

// === Multer setup for multipart form-data ===
const upload = multer({ storage: multer.memoryStorage() });

async function createStock(user_id, quantity, selling_price, buying_price, name) {
  await Stock.create({
    user_id,
    quantity,
    selling_price,
    buying_price,
    name,
  });
}

// === Create Product ===
router.post('/create_product', authMiddleware, upload.array('images'), async (req, res) => {
  try {
    const {
      name,
      quantity,
      selling_price,
      buying_price,
      category,
      measurement,
      description,
      business_id,
      min_stock,
      business_type,
      brand,
      pack_size,
      expire_date,
    } = req.body;

    const user = req.user;
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (quantity === undefined || isNaN(quantity) || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ error: 'Quantity must be an integer' });
    }
    if (selling_price === undefined || isNaN(selling_price)) {
      return res.status(400).json({ error: 'Selling price must be a valid number' });
    }
    if (buying_price === undefined || isNaN(buying_price)) {
      return res.status(400).json({ error: 'Buying price must be a valid number' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!measurement || Object.keys(measurement).length === 0) {
      return res.status(400).json({ error: 'Measurement is required' });
    }
    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // ==== Handle both file uploads and base64 ====
    let urls = [];
    if (req.files && req.files.length > 0) {
      // From multipart (Next.js web)
      const buffers = req.files.map((f) => ({
        buffer: f.buffer,
        mimeType: f.mimetype,
        originalname: f.originalname,
      }));
      urls = await uploadFiles(buffers);
    } else if (req.body.images) {
      // From base64 (Flutter)
      const base64Files = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
      urls = await uploadFiles(base64Files);
    } else {
      return res.status(400).json({ error: 'No images provided' });
    }

    // ==== Prepare Product Data ====
    const productData = {
      attendant_id: user.phone,
      name: name.trim(),
      business_id: Number(business_id),
      images: urls,
      quantity: Number(quantity),
      selling_price: Number(selling_price),
      buying_price: Number(buying_price),
      category: typeof category === 'string' || category.startsWith('{')
      ? JSON.parse(category)
      : category,
      measurement: typeof measurement === 'string' || measurement.startsWith('{')
      ? JSON.parse(measurement)
      : measurement,
      //measurement: measurement,
      description: description && description.trim() !== '' ? description : null,
      min_stock: min_stock === '' || min_stock === undefined ? null : Number(min_stock),
      business_type: business_type || null,
      brand: brand || null,
      pack_size: pack_size || null,
      expire_date: expire_date || null,
    };

    // ==== INSERT ====
    const product = await Product.create(productData);
    res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});


// === Add stock ===
router.post('/add_stock', authMiddleware, async (req, res) => {
  const { product_id, new_selling, new_buying, new_quantity } = req.body;
  const user = req.user;
  console.log(req.body)
  try {
    if (!product_id) {
      return res.status(400).json({ error: 'product id is required' });
    } else {
      const product = await Product.findOne({
        where: { id: product_id },
      });
      if (product) {
        if (
          product.selling_price === Number(new_selling) &&
          product.buying_price === Number(new_buying)
        ) {
          product.update({
            quantity: product.quantity + Number(new_quantity),
          });
          createStock(user.id, new_quantity, new_selling, new_buying, product.name);
          res.json(product);
        } else if (
          (product.selling_price !== new_selling || product.buying_price !== new_buying) &&
          product.quantity === 0
        ) {
          product.update({
            quantity: new_quantity,
            buying_price: new_buying,
            selling_price: new_selling,
          });
          createStock(user.id, new_quantity, new_selling, new_buying, product.name);
          res.json(product);
        } else if (
          (product.selling_price !== new_selling || product.buying_price !== new_buying) &&
          product.quantity > 0
        ) {
          product.update({
            new_quantity: new_quantity,
            new_buying_price: new_buying,
            new_selling_price: new_selling,
          });
          createStock(user.id, new_quantity, new_selling, new_buying, product.name);
          res.json(product);
        }
      } else {
        return res.status(400).json({ error: 'product not found' });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'internal server error' });
  }
});

// === Get Products ===
router.get('/get_products', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 5;
  const offset = (page - 1) * pageSize;
  const name = req.query.name;
  const business_id = req.query.business_id;

  const whereClause = {};

  try {
    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`, // partial match
      };
    } else {
      whereClause.business_id = {
        [Op.eq]: business_id,
      };
      whereClause.status = {
        [Op.eq]: 'active',
      };
    }
    const curr = await Product.findAndCountAll({
      offset: offset,
      limit: pageSize,
      order: [['id', 'ASC']],
      ...(Object.keys(whereClause).length && { where: whereClause }),
    });
    const all = await Product.findAll({
      where: {
        business_id,
        status: 'active',
      },
    });
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
// === Get deleted Products ===
router.get('/get_deleted_products', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 5;
  const offset = (page - 1) * pageSize;
  const name = req.query.name;
  const business_id = req.query.business_id;

  const whereClause = {};

  try {
    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`, // partial match
      };
    } else {
      whereClause.business_id = {
        [Op.eq]: business_id,
      };
      whereClause.status = {
        [Op.eq]: 'inactive',
      };
    }
    const curr = await Product.findAndCountAll({
      offset: offset,
      limit: pageSize,
      order: [['id', 'ASC']],
      ...(Object.keys(whereClause).length && { where: whereClause }),
    });
    const all = await Product.findAll({
      where: {
        business_id,
        status: 'deleted',
      },
    });
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
// === Get all Products ===
router.get('/get_all_products', async (req, res) => {
  const business_id = req.query.business_id;
  try {
    const curr = await Product.findAll({
      where: {
        business_id
      }
    });
    res.json(curr)
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// === Disable product ===
router.post('/disable_product', async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    } else {
      const prod = await Product.findOne({
        where: { id },
      });
      if (prod) {
        prod.update({
          status: 'inactive',
        });
        res.json(prod);
      } else {
        return res.status(400).json({ error: `product with id ${id} does not exist` });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: 'internal server error' });
  }
});
// === Restore product ===
router.post('/restore_product', async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    } else {
      const prod = await Product.findOne({
        where: { id },
      });
      if (prod) {
        prod.update({
          status: 'active',
        });
        res.json(prod);
      } else {
        return res.status(400).json({ error: `product with id ${id} does not exist` });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
