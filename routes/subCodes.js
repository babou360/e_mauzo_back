const express = require('express')
const router = express.Router()
const {SubCodes, Subscription} = require('../models/index')
const sendSMS = require('../routes/sendSms')

// create code 
router.post('/create_code', async (req, res) => {
  const { phone, message, amount } = req.body;
  try {
    // basic validation
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ error: 'phone is required' });
    }else if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'message is required' });
    }else if (!amount || amount.toString().trim() === '') {
      return res.status(400).json({ error: 'amount is required' });
    }

    // keep generating a code until we find a unique one
    let code;
    while (true) {
      code = Math.floor(1000 + Math.random() * 9000); // 4-digit code

      const found = await SubCodes.findOne({
        where: { code }
      });

      if (!found) {
        break; // unique code found, exit the loop
      }
      // if found, loop again and generate another code
    }

    const sub = await SubCodes.create({
      phone,
      message,
      amount,
      code,
    });
    sendSMS({
        senderId: 'KILAKONA',
        message: `Your Payment Verification code is ${sub.code}`,
        contacts: `${sub.phone}`,
    })
    res.json(sub);
  } catch (error) {
    return res.status(500).json({ error: 'internal server error' });
  }
});

// confirm payment
router.post('/confirm_payment', async (req, res) => {
  const { amount, code, business_id } = req.body;
  console.log(req.body)
  try {
    // Basic validations
    if (amount == null) {
      return res.status(400).json({ error: 'amount is required' });
    }
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }
    if (!business_id) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    // 1. Find the payment code
    const payCode = await SubCodes.findOne({
      where: { code },
    });

    if (!payCode) {
      return res.status(400).json({ error: 'code not found' });
    }

    // 2. Ensure the code covers at least the requested amount (allow greater, reject less)
    if (payCode.amount < amount) {
      return res.status(400).json({ error: 'insufficient amount in code' });
    }

    const basePricePerMonth = 10000;

    // Special bundles with discounts
    const discountBundles = [
      { months: 1, discountPercent: 0 },
      { months: 3, discountPercent: 5 },
      { months: 6, discountPercent: 10 },
      { months: 12, discountPercent: 20 },
    ];

    const paidAmount = amount;
    let monthsToAdd = 0;
    let paymentType = 'normal'; // 'full', 'discounted', or 'normal'

    // 3. First try to match a special discounted (or full) bundle
    for (const bundle of discountBundles) {
      const fullAmount = basePricePerMonth * bundle.months;
      const discountedAmount = Math.round(
        fullAmount * (1 - bundle.discountPercent / 100)
      );

      if (paidAmount === fullAmount) {
        monthsToAdd = bundle.months;
        paymentType = 'full';
        break;
      }

      if (paidAmount === discountedAmount) {
        monthsToAdd = bundle.months;
        paymentType = 'discounted';
        break;
      }
    }

    // 4. If no bundle matched, fall back to plain division by 10,000
    if (monthsToAdd === 0) {
      monthsToAdd = Math.floor(paidAmount / basePricePerMonth);
      paymentType = 'normal';
    }

    // 5. If still less than 1 month, reject
    if (monthsToAdd < 1) {
      return res.status(400).json({
        error:
          'amount does not reach minimum one month subscription (10,000 TZS)',
      });
    }

    // 6. Find existing subscription for the business
    const saba = await Subscription.findOne({
      where: {
        businessId: String(business_id), // businessId is STRING in DB
      },
    });

    if (!saba) {
      return res.status(400).json({ error: 'subscription not found for this business' });
    }

    // 7. Update lastPaid based on monthsToAdd
    let startDate;
    if (saba.lastPaid) {
      startDate = new Date(saba.lastPaid);
      if (isNaN(startDate.getTime())) {
        startDate = new Date();
      }
    } else {
      startDate = new Date();
    }

    const newLastPaid = new Date(startDate);
    newLastPaid.setMonth(newLastPaid.getMonth() + monthsToAdd);

    saba.lastPaid = newLastPaid;
    await saba.save();

    // Optional: mark code as used or update remaining amount if you want partial usage logic later
    // payCode.used = true;
    // await payCode.save();

    return res.status(200).json({
      message: 'payment confirmed and subscription updated',
      monthsAdded: monthsToAdd,
      lastPaid: saba.lastPaid,
      paymentType, // 'full', 'discounted', or 'normal'
    });
  } catch (error) {
    return res.status(500).json({ error: 'internal server error' });
  }
});


// router.post('/confirm_payment', async (req, res) => {
//   const { amount, code, business_id } = req.body;

//   try {
//     // Basic validations
//     if (amount == null) {
//       return res.status(400).json({ error: 'amount is required' });
//     }
//     if (!code) {
//       return res.status(400).json({ error: 'code is required' });
//     }
//     if (!business_id) {
//       return res.status(400).json({ error: 'business_id is required' });
//     }

//     // Find the payment code
//     const payCode = await SubCodes.findOne({
//       where: {
//         code, // code is INTEGER in DB, make sure req.body.code is also a number or Sequelize will cast
//       },
//     });

//     if (!payCode) {
//       return res.status(400).json({ error: 'code not found' });
//     }

//     // Ensure the code covers at least the requested amount (extra safety)
//     if (payCode.amount < amount) {
//       return res.status(400).json({ error: 'insufficient amount in code' });
//     }

//     const basePricePerMonth = 10000;

//     // Valid month options and their discounts
//     const discountMap = {
//       1: 0,   // 0%
//       3: 5,   // 5%
//       6: 10,  // 10%
//       12: 20, // 20%
//     };

//     const availableMonths = Object.keys(discountMap).map((m) => parseInt(m, 10));

//     const possibleMatches = [];
//     const paidAmount = payCode.amount; // use the amount actually stored on the code

//     for (const m of availableMonths) {
//       const discountPercent = discountMap[m];
//       const discountedMultiplier = 1 - discountPercent / 100;

//       const fullAmount = basePricePerMonth * m; // no discount
//       const discountedAmount = Math.round(fullAmount * discountedMultiplier);

//       if (paidAmount === fullAmount) {
//         possibleMatches.push({ months: m, type: 'full', expectedAmount: fullAmount });
//       }
//       if (paidAmount === discountedAmount) {
//         possibleMatches.push({ months: m, type: 'discounted', expectedAmount: discountedAmount });
//       }
//     }

//     if (possibleMatches.length === 0) {
//       return res.status(400).json({
//         error: 'amount does not match any valid subscription (with or without discount)',
//       });
//     }

//     // Take the first valid match
//     const selected = possibleMatches[0];
//     const monthsToAdd = selected.months;

//     // Find existing subscription for the business
//     // businessId is STRING in DB, so use business_id as-is but be sure it's a string
//     const saba = await Subscription.findOne({
//       where: {
//         businessId: String(business_id),
//       },
//     });

//     if (!saba) {
//       return res.status(400).json({ error: 'subscription not found for this business' });
//     }

//     // Update lastPaid based on monthsToAdd
//     let startDate;
//     if (saba.lastPaid) {
//       startDate = new Date(saba.lastPaid);
//       if (isNaN(startDate.getTime())) {
//         startDate = new Date();
//       }
//     } else {
//       startDate = new Date();
//     }

//     const newLastPaid = new Date(startDate);
//     newLastPaid.setMonth(newLastPaid.getMonth() + monthsToAdd);

//     saba.lastPaid = newLastPaid;

//     // Optionally mark code as used
//     // payCode.used = true;
//     // await payCode.save();

//     await saba.save();

//     return res.status(200).json({
//       message: 'payment confirmed and subscription updated',
//       monthsAdded: monthsToAdd,
//       lastPaid: saba.lastPaid,
//       paymentType: selected.type, // 'full' or 'discounted'
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'internal server error' });
//   }
// });




module.exports = router