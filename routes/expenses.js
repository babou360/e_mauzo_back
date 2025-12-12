const express = require('express')
const router = express.Router()
const { ExpenseGroup, Expense } = require('../models/index')

// get expense group
router.get('/get_expense_groups', async(req,res)=> {
 const {business_id} = req.query
  try{
    if(!business_id){
      return res.status(400).json({error: "business id is required"})  
    }else{
        const biziExpe = await ExpenseGroup.findAll({
            where:{business_id},
            order: [['createdAt', 'DESC']]
        })
        res.json(biziExpe)
    }
  }catch(error){
    res.status(500).json({error: "internal server error"})
  }
})
// get expense group
router.get('/get_expenses', async(req,res)=> {
 const {business_id} = req.query
  try{
    if(!business_id){
      return res.status(400).json({error: "business id is required"})  
    }else{
        const biziExpe = await Expense.findAll({
            where:{business_id},
            order: [['createdAt', 'DESC']]
        })
        res.json(biziExpe)
    }
  }catch(error){
    res.status(500).json({error: "internal server error"})
  }
})
// create expense group
router.post('/create_expense_group', async(req,res)=> {
 const {name,description,business_id} = req.body
  try{
    if(!name || name.trim()==""){
        return res.status(400).json({error: "name is required"})
    }else if(!business_id){
      return res.status(400).json({error: "business id is required"})  
    }else{
        const biziExpe = await ExpenseGroup.create(req.body)
        res.json(biziExpe)
    }
  }catch(error){
    res.status(500).json({error: "internal server error"})
  }
})
// delete expense group
router.post('/delete_expense_group', async(req,res)=> {
 const {id} = req.body
  try{
    if(!id){
        return res.status(400).json({error: "id is required"})
    }else{
        const biziExpe = await ExpenseGroup.findOne({
            where: {id}
        })
        if(id){
            biziExpe.destroy()
            res.json(biziExpe)
        }else{
            return res.status(400).json({error: `expense group with id ${id} was not found`})
        }
    }
  }catch(error){
    res.status(500).json({error: "internal server error"})
  }
})
// delete expense
router.post('/delete_expense', async(req,res)=> {
 const {id} = req.body
  try{
    if(!id){
        return res.status(400).json({error: "id is required"})
    }else{
        const exp = await Expense.findOne({
            where: {id}
        })
        if(id){
            exp.destroy()
            res.json(exp)
        }else{
            return res.status(400).json({error: `expense with id ${id} was not found`})
        }
    }
  }catch(error){
    res.status(500).json({error: "internal server error"})
  }
})

// create expense
router.post('/create_expense', async(req,res)=> {
 const {name,amount,business_id,category} = req.body
  try{
    if(!name || name.trim()==""){
        return res.status(400).json({error: "name is required"})
    }else if(!amount){
        return res.status(400).json({error: "name is required"})
    }else if(!category || category.trim()==""){
        return res.status(400).json({error: "category is required"})
    }else if(!business_id){
      return res.status(400).json({error: "business id is required"})  
    }else{
        const expe = await Expense.create(req.body)
        res.json(expe)
    }
  }catch(error){
    res.status(500).json({error: "internal server error"})
  }
})

module.exports = router