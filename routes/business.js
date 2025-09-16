const express = require('express')
const router = express.Router()
const {Business} = require('../models/index')
const authMiddleware = require('../utils/authMiddleware')
const { Op } = require("sequelize");

router.post("/register",authMiddleware, async (req,res) => {
    const {name,category,country,city,district,ward,street,type,latlong,phone,email} = req.body
    const user = req.user
    try{
        if(name.trim()===""){
        return res.status(400).json({error: "Business name is required"})
    }else if(category.trim()===""){
        return res.status(400).json({error: "Business category is required"})
    }else if(country.trim()===""){
        return res.status(400).json({error: "Business country is required"})
    }else if(city.trim()===""){
        return res.status(400).json({error: "Business city is required"})
    }else if(type.trim()===""){
        return res.status(400).json({error: "Business type is required"})
    }else{
        const bizi = await Business.findAll({
            where: {
                user_id:  {
                [Op.contains]: [user.phone]
                }
            }
        })
        if(bizi.length >= 3){
           return res.status(400).json({error: "Business with this user reached limit"}) 
        }else{
            const business = await Business.create({
            name,
            category,
            country,
            city,
            district,
            ward,
            street,
            type,
            latlong,
            user_id: [user.phone],
            phone,
            email
        })
        res.json(business)
        }
    }
    }catch(error){
        console.log(error)
        return res.status(500).json({error: error})
    }
})

// get user businesses
router.get("/get_user_businesses",authMiddleware, async (req,res)=> {
    const user = req.user
    try{
        const bizi = await Business.findAll({
            where: {
                status: "active",
                user_id:  {
                [Op.contains]: [user.phone]
                }
            }
        })
        res.json(bizi)
    }catch(error){
        return res.status(500).json({error: error})
    }
})
// get user deleted businesses
router.get("/get_user_deleted_businesses",authMiddleware, async (req,res)=> {
    const user = req.user
    try{
        const bizi = await Business.findAll({
            where: {
                status: "deleted",
                user_id:  {
                [Op.contains]: [user.phone]
                }
            }
        })
        res.json(bizi)
    }catch(error){
        return res.status(500).json({error: error})
    }
})
// get selected business
router.get("/get_selected_business",authMiddleware, async (req,res)=> {
    const business_id = req.query.business_id
    const user = req.user
    console.log('business id is ',business_id)
    try{
        if(!business_id){
            return res.status(400).json({error: "business id is required"})
        }else{
            const bizi = await Business.findOne({
            where: {
                user_id:  {
                [Op.contains]: [user.phone]
                },
                status: "active",
                id: Number(business_id)
            }
        })
        res.json(bizi)
        }
    }catch(error){
        return res.status(500).json({error: error})
    }
})
//edit selected business
router.post("/edit_business",authMiddleware, async (req,res)=> {
    const {business_id,name,category,type,country,city,district,ward,street,phone,email,latlong} = req.body
    const user = req.user
    try{
        if(!business_id){
            return res.status(400).json({error: "business id is required"})
        }else{
            const bizi = await Business.findOne({
            where: {
                user_id:  {
                [Op.contains]: [user.phone]
                },
                id: Number(business_id)
            }
        })
        if(bizi){
            bizi.update({
                name,
                phone,
                category,
                type,
                country,
                city,
                district,
                ward,
                street,
                latlong,
                phone,
                email
            })
            res.json(bizi)
        }else{
            return res.status(400).json({error: "business not found"})
        }
        }
    }catch(error){
        return res.status(500).json({error: error})
    }
})
// deactivate business
router.post("/deactivate_business",authMiddleware, async (req,res)=> {
    const {business_id} = req.body
    const user = req.user
    try{
        if(!business_id){
            return res.status(400).json({error: "business id is required"})
        }else{
            const bizi = await Business.findOne({
            where: {
                user_id:  {
                [Op.contains]: [user.phone]
                },
                id: Number(business_id)
            }
        })
        if(bizi){
            bizi.update({
                status: 'deleted'
            })
            res.json(bizi)
        }else{
            return res.status(400).json({error: "business not found"})
        }
        }
    }catch(error){
        return res.status(500).json({error: error})
    }
})
// restore business
router.post("/restore_business",authMiddleware, async (req,res)=> {
    const {business_id} = req.body
    const user = req.user
    try{
        if(!business_id){
            return res.status(400).json({error: "business id is required"})
        }else{
            const bizi = await Business.findOne({
            where: {
                user_id:  {
                [Op.contains]: [user.phone]
                },
                id: Number(business_id)
            }
        })
        if(bizi){
            bizi.update({
                status: 'active'
            })
            res.json(bizi)
        }else{
            return res.status(400).json({error: "business not found"})
        }
        }
    }catch(error){
        return res.status(500).json({error: error})
    }
})

module.exports = router