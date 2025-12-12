require('dotenv').config();
const express = require('express');
const router = express.Router();
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const {OTP, User} = require('../models/index')

router.post("/send_otp", async (req, res) => {
  const { recipient } = req.body;

  try {
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILER_SEND_API_KEY
    });

    // ✅ Use a valid email address that you verified in MailerSend
    const sentFrom = new Sender("info@brykesmarthub.org", "Swahilicodes");
    const otp = await createOtp()
    // ✅ Create a Recipient object from the recipient email string
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([new Recipient(recipient)])
      .setReplyTo(sentFrom) // also must be valid
      .setSubject("E-Mauzo OTP")
      //.setHtml("<strong>This is the HTML content</strong>")
      .setText(`This is your one time password ${otp}`);
    
    const response = await mailerSend.email.send(emailParams);
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.body || error.message || error });
  }
});

router.post('/create_otp', async (req,res) => {
    try{
       createOtp().then((otp) => {
     });
    } catch(error){
        res.status(500).json({error: error})
    }
})
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

// verify otp
router.post('/verify_otp', async (req,res) => {
  const {code,email} = req.body
  try{
    const otp = await OTP.findOne({
      where: {code}
    })
    if(otp){
      if(new Date(otp.createdAt) < new Date(Date.now() - 5 * 60 * 1000)){
        return res.status(400).json({error: 'OTP has expired'})
      }else{
        const user = await User.findOne({
          where: {email: email}
        })
        if(user){
          user.update({
            status: "active"
          })
          res.json(user)
        }else{
          return res.status(400).json({error: `user with email ${email} does not exist`})
        }
      }
    }else{
      return res.status(400).json({error: 'OTP does not exist'})
    }
  } catch(error){
    res.status(500).json({error: error})
  }
})

module.exports = router;
