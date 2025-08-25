const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const users = require('./routes/user')
const business = require('./routes/business')
const product = require('./routes/products')
const sales = require('./routes/sales')
const ms_cats = require('./routes/ms_category')
const product_categories = require('./routes/product_category')
const otp = require('./routes/otp')
const sales_analytics = require('./routes/sales_analytics')
const attendant = require('./routes/attendant/attendant')
const PORT = 5000

app.use(cors())
app.use(bodyParser.json())
app.use('/users',users)
app.use('/business',business)
app.use('/products',product)
app.use('/sales',sales)
app.use('/ms-cats',ms_cats)
app.use('/product-cats',product_categories)
app.use('/otp',otp)
app.use('/sales-analytics',sales_analytics)
app.use('/attendant',attendant)
// app.listen( PORT,() =>{
//     console.log(`app running on http://localhost:${PORT}`)
// })
app.listen(PORT, '0.0.0.0', () => {
  console.log(`app running on http://0.0.0.0:${PORT}`);
});
