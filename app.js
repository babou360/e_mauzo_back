const express = require('express')
const cors = require('cors')
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
const upload = require('./routes/upload')
const damages = require('./routes/damage')
const suppliers = require('./routes/supplier')
const expenses = require('./routes/expenses')
const buyers = require('./routes/buyers')
const subCodes = require('./routes/subCodes')
const PORT = 5000

app.use(cors())

// Use only express.json with a high limit
app.use(express.json({ limit: "100mb" }));          // JSON bodies up to 100MB
app.use(express.urlencoded({ limit: "100mb", extended: true }));  // form bodies

app.use('/users', users)
app.use('/business', business)
app.use('/products', product)
app.use('/sales', sales)
app.use('/ms-cats', ms_cats)
app.use('/product-cats', product_categories)
app.use('/otp', otp)
app.use('/sales-analytics', sales_analytics)
app.use('/attendant', attendant)
app.use('/upload', upload)
app.use('/damages', damages)
app.use('/suppliers', suppliers)
app.use('/expenses', expenses)
app.use('/buyers', buyers)
app.use('/subcodes', subCodes)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`app running on http://0.0.0.0:${PORT}`);
});
