const express = require('express')
const router = express.Router()
const {Business} = require('../models/index')
const authMiddleware = require('../utils/authMiddleware')
const { Op } = require("sequelize");

router.post("/register",authMiddleware, async (req,res) => {
    const {name,category,country,city,district,ward,street,type,latlong} = req.body
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
            user_id: [user.phone]
        })
        res.json(business)
        }
    }
    }catch(error){
        console.log(error)
        return res.status(500).json({error: error})
    }
})

router.get("/get_user_businesses",authMiddleware, async (req,res)=> {
    const user = req.user
    try{
        const bizi = await Business.findAll({
            where: {
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
                id: Number(business_id)
            }
        })
        res.json(bizi)
        }
    }catch(error){
        return res.status(500).json({error: error})
    }
})

module.exports = router