const express = require('express')
const router = express.Router()
const {Buyer} = require('../models/index')
const {Op} = require('sequelize')

// get buyers
router.get('/get_buyers', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const offset = (page - 1) * pageSize;
    const business_id = req.query.business_id;
    const search = req.query.search || '';

    try {
        // Base condition
        const whereClause = {
            business_id: business_id,
        };

        // Add search condition only if provided
        if (search) {
            whereClause[Op.and] = [
                {
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${search}%` } },
                        { phone: { [Op.iLike]: `%${search}%` } }
                    ]
                }
            ];
        }

        const curr = await Buyer.findAndCountAll({
            where: whereClause,
            offset,
            limit: pageSize,
            order: [['id', 'ASC']],
        });

        const all = await Buyer.findAll({
            where: { business_id }
        });
        res.json({
            data: curr.rows,
            all,
            totalItems: curr.count,
            totalPages: Math.ceil(curr.count / pageSize),
        });
    } catch (error) {
        console.error('Error fetching buyers:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router