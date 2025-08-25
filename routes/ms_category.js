const express = require('express')
const router = express.Router()
const {MS_CAT} = require('../models/index')

router.post('/create_ms_cat', async (req,res)=> {
const {name,examples} = req.body
try{
    if(Object.entries(name).length <1){
        return res.status(400).json({error: "name cannot be empty"})
    }else if(examples.length <1){
      return res.status(400).json({error: "write atleast one example"})  
    }else{
        const cat = await MS_CAT.create(req.body)
        res.json(cat)
    }
}catch (error){
    console.log(error)
    res.status(500).json({error: error})
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
module.exports = router