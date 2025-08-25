const express = require('express')
const router = express.Router()
const { User } = require('../models/index')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const authMiddleware = require('../utils/authMiddleware')

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}


router.post("/register", async (req, res) => {
    const { name, phone, email, role, password, language } = req.body
    try {
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
        } else {
            const hashed = await bcrypt.hash(password, 12)
            const existing = await User.findOne({
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
            if (existing) {
                return res.status(400).json({ error: "email or phone exists" })
            } else {
                const user = await User.create({
                    name,
                    phone,
                    email,
                    role,
                    password: hashed
                })
                const correct = await bcrypt.compare(password, user.password)
                if (!correct) {
                    return res.status(400).json({ error: 'password not correct' });
                } else {
                    const token = jwt.sign({ phone, role: user.role }, "Green Mauzo", { expiresIn: 36 * 36 })
                    axios.post('http://localhost:5000/otp/send_otp',{recipient: email}).then((data)=> {
                        res.json({
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        phone: user.phone,
                        email: user.email,
                        status: user.status,
                        last_paid: user.last_paid,
                        token: token
                    });
                    }).catch((error) => {
                        res.status(500).json({error: error})
                    })
                }
                //res.json(user)
            }
        }
    } catch (error) {
        console.log('the error is ', error)
        return res.status(500).json({ error: error })
    }
})

// login 
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        if (email.trim() === "") {
            return res.status(400).json({ error: 'email or phone is required' })
        } else if (password.trim() === '') {
            return res.status(400).json({ error: "password is required" })
        } else {
            const condition = isValidEmail(email)
            ? { email: email }
            : { phone: email };
            const user = await User.findOne({
            where: condition
            });
            if (!user) {
                return res.status(400).json({ error: 'user not found' });
            } else {
                const correct = await bcrypt.compare(password, user.password)
                if (!correct) {
                    return res.status(400).json({ error: 'password not correct' });
                } else {
                    const token = jwt.sign({ phone: user.phone, role: user.role }, "Green Mauzo", { expiresIn: "1y" })
                    res.json({
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        phone: user.phone,
                        email: user.email,
                        status: user.status,
                        last_paid: user.last_paid,
                        token: token
                    });
                    //res.json(token);
                }
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "internal server error" });
    }
});

router.get("/get_users", async (req, res) => {
    try {
        const user = await User.findAll()
        res.json(user)
    } catch (error) {
        return res.status(500).json({ error: error })
    }
})
// get current user
router.get("/get_current_user",authMiddleware, async (req, res) => {
    const usa = req.user
    try {
        const user = await User.findOne({
            where: {phone: usa.phone}
        })
        res.json(user)
    } catch (error) {
        return res.status(500).json({ error: error })
    }
})

module.exports = router