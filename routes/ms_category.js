const express = require('express')
const router = express.Router()
const {MS_CAT,Measurement} = require('../models/index')

// create measurement category
router.post('/create_ms_cat', async (req,res)=> {
const {swahili,english,value,examples_swahili,examples_english} = req.body
try{
    if(!swahili || swahili.trim()==""){
        return res.status(400).json({error: "swahili name cannot be empty"})
    }else if(!english || english.trim()==""){
        return res.status(400).json({error: "english name cannot be empty"})
    }else if(!value || value.trim()==""){
        return res.status(400).json({error: "value name cannot be empty"})
    }else if(examples_swahili.length <1){
      return res.status(400).json({error: "write atleast one swahili example"})  
    }else if(examples_english.length <1){
      return res.status(400).json({error: "write atleast one english example"})  
    }else{
        const cat = await MS_CAT.create(req.body)
        res.json(cat)
    }
}catch (error){
    res.status(500).json({error: "internal server error"})
}
})
// create measurement
router.post('/create_measurement', async (req,res)=> {
const {swahili,english,short_form,category,description} = req.body
try{
    if(!swahili || swahili.trim()==""){
        return res.status(400).json({error: "swahili name cannot be empty"})
    }else if(!english || english.trim()==""){
        return res.status(400).json({error: "english name cannot be empty"})
    }else if(!short_form || short_form.trim()==""){
        return res.status(400).json({error: "short_form name cannot be empty"})
    }else{
        const ms = await Measurement.create(req.body)
        res.json(ms)
    }
}catch (error){
    res.status(500).json({error: "internal server error"})
}
})

// get ms categories
router.get('/get_ms_cats', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const name = req.query.name
    
    const whereClause = {};

    try {
        if (name) {
    whereClause.name = {
        [Op.iLike]: `%${name}%`  // for partial match, optional
    };
    }
        const curr = await MS_CAT.findAndCountAll({
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']],
            ...(Object.keys(whereClause).length && { where: whereClause })
        })
        const all = await MS_CAT.findAll()
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
// get measurements
router.get('/get_measurements', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const name = req.query.name
    
    const whereClause = {};

    try {
        if (name) {
    whereClause.name = {
        [Op.iLike]: `%${name}%`  // for partial match, optional
    };
    }
        const curr = await Measurement.findAndCountAll({
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']],
            ...(Object.keys(whereClause).length && { where: whereClause })
        })
        const all = await Measurement.findAll()
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