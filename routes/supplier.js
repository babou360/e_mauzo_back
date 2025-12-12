const express = require('express')
const router = express.Router()
const {Supplier} = require('../models/index')
const authMiddleware = require('../utils/authMiddleware')
const {Op} = require('sequelize')

// create supplier
router.post('/create_supplier',authMiddleware, async(req,res) => {
    const {name,phone,country,city,district,ward,street,latlong,category,email,business_id} = req.body
    const user = req.user
    try{
        if(!name || name.trim()===""){
            return res.status(400).json({error: "name cannot be empty"})
        }else if(!country || country.trim()===""){
            return res.status(400).json({error: "country cannot be empty"})
        }else if(!phone || phone.trim()===""){
            return res.status(400).json({error: "phone cannot be empty"})
        }else if(!city || city.trim()===""){
            return res.status(400).json({error: "city cannot be empty"})
        }else if(!business_id){
            return res.status(400).json({error: "business id cannot be empty"})
        }else{
            const sapa = await Supplier.create({
                name,
                phone,
                email,
                country,
                city,
                district,
                ward,
                street,
                latlong,
                category,
                business_id,
                created_by: user.phone
            })
            res.json(sapa)
        }
    } catch(error){
        res.status(500).json({error: 'internal server error'})
    }
})

router.get('/get_suppliers', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const name = req.query.name
    const business_id = req.query.business_id
    
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
        whereClause.status = {
            [Op.eq]: "active"
        }
    }
        const curr = await Supplier.findAndCountAll({
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']],
            ...(Object.keys(whereClause).length && { where: whereClause })
        })
        const all = await Supplier.findAll({
            where: {
                id: business_id,
                status: "active"
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
// get deleted attendants
router.get('/get_deleted_attendants', async (req, res) => {
    const business_id = req.query.business_id
    try {
        const curr = await Attendant.findAll({
            where: {
                business_id: business_id,
                status: "disabled"
            }
        })
        res.json(curr);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// deactivate attendant
router.post('/deactivate_attendant', async (req,res) => {
    const {id} = req.body
    try{
        const attend = await Attendant.findOne({
            where: {id}
        })
        if(attend){
            attend.update({
                status: "disabled"
            })
            res.json(attend)
        }else{
            return res.status(400).json({error: "attendant not found"})
        }
    }catch(error){
        res.status(500).json({error: error})
    }
})
// restore attendant
router.post('/restore_attendant', async (req,res) => {
    const {id} = req.body
    try{
        const attend = await Attendant.findOne({
            where: {id}
        })
        if(attend){
            attend.update({
                status: "active"
            })
            res.json(attend)
        }else{
            return res.status(400).json({error: "attendant not found"})
        }
    }catch(error){
        res.status(500).json({error: error})
    }
})
// delete attendant
router.post('/delete_attendant', async (req,res) => {
    const {id} = req.body
    try{
        const attend = await Attendant.findOne({
            where: {id}
        })
        if(attend){
            attend.destroy()
            res.json(attend)
        }else{
            return res.status(400).json({error: "attendant not found"})
        }
    }catch(error){
        res.status(500).json({error: error})
    }
})
module.exports = router