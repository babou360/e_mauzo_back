const express = require('express')
const router = express.Router()
const { User,OTP, Subscription } = require('../models/index')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const authMiddleware = require('../utils/authMiddleware')
const sendSMS = require('../routes/sendSms')
const sendEmail = require('../routes/sendEmail')
require('dotenv').config();

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function createOtp() {
  let code;
  while (true) {
    code = Math.floor(100000 + Math.random() * 900000);
    const existing = await OTP.findOne({ where: { code } });

    if (!existing) {
      await OTP.create({ code });
      return code;
    }
  }
}
// send message
router.post('/send_message', async(req,res)=> {
    try{
    const otp = await createOtp()
    //console.log('otp is ',otp)
    res.json(otp)
    // const response = await sendEmail({
    //     to: "leebabou@gmail.com",
    //     subject: "Test Email",
    //     text: "This is a plain text email from Node.js",
    //     html: "<h1>Hello!</h1><p>This is a test email.</p>",
    //  });
    // const response = await sendSMS({
    //   senderId: 'KILAKONA',
    //   message: 'Hello this is Mauzo Plus',
    //   contacts: '0785008525',
    // });
    //res.json(response);
    }catch(error){
        res.status(500).json({error: error})
    }
})
// register user
router.post("/register", async (req, res) => {
    const { name, phone, email, role, password, language,verification_method } = req.body
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
                    if(verification_method=="email"){
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
                    }else{
                        const otp = await createOtp()
                        const response = await sendSMS({
                        senderId: 'KILAKONA',
                        message: `Your one time password is ${otp}`,
                        contacts: `${user.phone}`,
                        });
                        if(response.code==200){
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
                        }else{
                            return res.status(400).json({error: "there is an error"})
                        }
                    }
                }
                //res.json(user)
            }
        }
    } catch (error) {
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
                    const sub = await Subscription.findOne({
                        where: {
                          userIds: {
                            [Op.contains]: [user.id],
                            }, 
                        }
                    })
                    const token = jwt.sign({ phone: user.phone, role: user.role }, "Green Mauzo", { expiresIn: "1y" })
                    res.json({
                        subscription: sub,
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
        if(user){
            const sub = await Subscription.findOne({
            where: {
                userIds: {
                [Op.contains]: [user.id],
                }, 
            }
        })
        res.json({
            user: user,
            subscription: sub
        })
        }
    } catch (error) {
        return res.status(500).json({ error: error })
    }
})

module.exports = router