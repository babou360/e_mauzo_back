const express = require('express')
const router = express.Router()
const {Attendant} = require('../../models/index')
const {Op} = require('sequelize')

router.post('/register_attendant', async (req,res) => {
    const { name, phone, email, role, password, business_id } = req.body
    try{
        if (name.trim() === "") {
            return res.status(400).json({ error: "name is empty" })
        } else if (phone.trim() === "") {
            return res.status(400).json({ error: "phone is empty" })
        } else if (email.trim() === "") {
            return res.status(400).json({ error: "email is empty" })
        } else if (role.trim() === "") {
            return res.status(400).json({ error: "role is empty" })
        } else if (password.trim() === "") {
            return res.status(400).json({ error: "password is empty" })
        }else if(!business_id){
            return res.status(400).json({ error: "business id is empty" })
        }else{
            const atta = await Attendant.findOne({
                where: {
                    [Op.or]: [
                        {
                            email: email
                        },
                        {
                            phone: phone
                        }
                    ]
                }
            })
            if(atta){
                return res.status(400).json({error: "attendant exists"})
            }else{
                const attaya = await Attendant.create(req.body)
                res.json(attaya)
            }
        }
    } catch(error){
        res.status(500).json({error: error})
    }
})
// get attendants
router.get('/get_attendants', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
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
    }
        const curr = await Attendant.findAndCountAll({
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']],
            ...(Object.keys(whereClause).length && { where: whereClause })
        })
        const all = await Attendant.findAll({
            where: {
                id: business_id
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