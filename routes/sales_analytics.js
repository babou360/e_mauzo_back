const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const { Sales, Damage } = require('../models');

const Op = Sequelize.Op;

function getDateRange(duration, start_date, end_date) {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (duration.toLowerCase()) {
        case 'day':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            end.setDate(diff + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(11, 31);
            end.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            if (start_date && end_date) {
                let start = new Date(start_date);
                let end = new Date(end_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            } else if (start_date) {
                let start = new Date(start_date);
                start.setHours(0, 0, 0, 0);
                return { start, end: start };
            } else if (end_date) {
                let end = new Date(end_date);
                end.setHours(23, 59, 59, 999);
                return { start: end, end };
            }
            throw new Error("Custom range requires at least one of start_date or end_date.");
        case 'all':
        default:
            return { start: new Date(0), end: new Date() };
    }

    return { start, end };
}

router.get('/sales_analytics', async (req, res) => {
    const { duration = 'day', start_date,end_date, business_id } = req.query;
    const TZ_SHIFT = 3; 
    try {
        if (!business_id) {
            return res.status(400).json({ error: "business_id is required" });
        }

        // ---------- Date range ----------
        const { start: rangeStart, end: rangeEnd } = getDateRange(duration, start_date, end_date);
        const startTime = new Date(rangeStart); startTime.setHours(0, 0, 0,0);
        const endTime = new Date(rangeEnd); endTime.setHours(23, 59, 59, 999);

        if (!Sales) throw new Error("Sales model is not properly initialized");

        const modelAttributes = Sales.rawAttributes;
        const hasSellerColumn = !!modelAttributes.seller;
        const hasBusinessIdColumn = !!modelAttributes.business_id;
        if (!hasBusinessIdColumn) throw new Error("business_id column not found in Sales table");

        // ---------- Base metrics ----------
        const totalMetrics = await Sales.findOne({
            where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id, status: "active" },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_orders'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue'],
            ],
            raw: true
        });

        // ---------- Hourly sales ----------
        const hourlySales = await Sales.findAll({
            where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id, status: "active" },
            attributes: [
                [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00'), 'hour'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_sales'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue']
            ],
            group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00')],
            order: [[Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00'), 'ASC']],
            raw: true
        });

        const hourlyResult = Array.from({ length: 24 }, (_, i) => ({
            hour: i.toString().padStart(2, '0') + ':00',
            total_sales: 0,
            total_revenue: 0,
            total_products: 0,
            products: []
        }));

        hourlySales.forEach(sale => {
            const hourIndex = parseInt(sale.hour.split(':')[0], 10);
            const shiftedHourIndex = (hourIndex + TZ_SHIFT) % 24;
            hourlyResult[shiftedHourIndex].total_sales = parseInt(sale.total_sales, 10);
            hourlyResult[shiftedHourIndex].total_revenue = parseFloat(sale.total_revenue);
        });

        // ---------- Fetch all sales for deep product analysis ----------
        const allSales = await Sales.findAll({
            where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id, status: "active" },
            attributes: ['products', [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00'), 'hour']],
            raw: true
        });

        const uniqueProducts = new Set();
        let netProfit = 0;
        const displayProductsMap = {};
        const productAnalyticsMap = {}; // For top_products with cost & revenue

        allSales.forEach(sale => {
            let products = sale.products || [];
            if (typeof products === 'string') {
                try { products = JSON.parse(products); } catch { products = []; }
            }

            const hourStr = sale.hour || '00:00';
            const hourIndex = parseInt(hourStr.split(':')[0], 10);
            const shiftedHourIndex = (hourIndex + TZ_SHIFT) % 24;
            const hourData = hourlyResult[shiftedHourIndex];

            products.forEach(p => {
                if (!p || !p.name) return;

                const key = p.name.toString().trim().toLowerCase();
                uniqueProducts.add(key);

                const qty = parseFloat(p.quantity) || 0;
                const selling = parseFloat(p.selling_price) || 0;
                const buying = parseFloat(p.buying_price) || 0;

                // Net profit (summary)
                if (qty > 0 && selling >= 0 && buying >= 0) {
                    netProfit += (selling * qty) - (buying * qty);
                }

                // Hourly aggregation
                let existingHour = hourData.products.find(prod => prod.product_name === p.name);
                if (existingHour) {
                    existingHour.count += 1;
                    const prevQty = parseFloat(existingHour.quantity) || 0;
                    const unit = existingHour.quantity.replace(/[0-9.]/g, "").trim();
                    existingHour.quantity = `${prevQty + qty}${unit || ''}`;
                } else {
                    hourData.products.push({
                        product_name: p.name,
                        count: 1,
                        quantity: `${qty}${p.measurement || ''}`,
                        measurement: p.measurement || null
                    });
                }

                // Display products (summary)
                if (displayProductsMap[key]) {
                    displayProductsMap[key].count += 1;
                    const prevQty = parseFloat(displayProductsMap[key].quantity) || 0;
                    const unit = displayProductsMap[key].quantity.replace(/[0-9.]/g, "").trim();
                    displayProductsMap[key].quantity = `${prevQty + qty}${unit || ''}`;
                } else {
                    displayProductsMap[key] = {
                        product_name: p.name,
                        count: 1,
                        quantity: `${qty}${p.measurement || ''}`,
                        measurement: p.measurement || null
                    };
                }

                // Top products with revenue & cost
                if (!productAnalyticsMap[key]) {
                    productAnalyticsMap[key] = {
                        product_name: p.name,
                        times_sold: 0,
                        total_quantity: 0,
                        total_revenue: 0,
                        total_cost: 0,
                        measurement: p.measurement || null
                    };
                }
                const item = productAnalyticsMap[key];
                item.times_sold += 1;
                item.total_quantity += qty;
                item.total_revenue += selling * qty;
                item.total_cost += buying * qty;
            });

            hourData.total_products = hourData.products.length;
        });

        const displayProducts = Object.values(displayProductsMap);

        // Format top products
        const topProducts = Object.values(productAnalyticsMap)
            .map(p => ({
                product: p.product_name,
                count: p.times_sold,
                total_quantity: p.total_quantity,
                revenue: Number(p.total_revenue.toFixed(2)),
                total_cost: Number(p.total_cost.toFixed(2)),
                profit: Number((p.total_revenue - p.total_cost).toFixed(2)),
                measurement: p.measurement.short_form || 'kg'
            }))
            .sort((a, b) => b.count - a.count);

        // ---------- Sellers ----------
        let formattedSellers = [];
        if (hasSellerColumn) {
            const sellerAnalytics = await Sales.findAll({
                where: {
                    createdAt: { [Op.between]: [startTime, endTime] },
                    business_id,
                    status: "active",
                    seller: { [Op.ne]: null }
                },
                attributes: [
                    [Sequelize.literal(`seller->>'name'`), 'seller_name'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_orders'],
                    [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue']
                ],
                group: [Sequelize.literal(`seller->>'name'`)],
                order: [[Sequelize.literal('total_revenue'), 'DESC']],
                raw: true
            });

            formattedSellers = sellerAnalytics.map(seller => ({
                seller_name: seller.seller_name || 'Unknown',
                total_orders: parseInt(seller.total_orders, 10),
                total_revenue: parseFloat(seller.total_revenue)
            }));
        }

        // ---------- Daily sales ----------
        const dailySales = await Sales.findAll({
            where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id, status: "active" },
            attributes: [
                [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Day'), 'day'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_sales'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue']
            ],
            group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Day')],
            raw: true
        });

        const daysMap = {
            'Monday': { total_sales: 0, total_revenue: 0 },
            'Tuesday': { total_sales: 0, total_revenue: 0 },
            'Wednesday': { total_sales: 0, total_revenue: 0 },
            'Thursday': { total_sales: 0, total_revenue: 0 },
            'Friday': { total_sales: 0, total_revenue: 0 },
            'Saturday': { total_sales: 0, total_revenue: 0 },
            'Sunday': { total_sales: 0, total_revenue: 0 }
        };

        dailySales.forEach(dayData => {
            const dayName = dayData.day.trim();
            if (daysMap[dayName] !== undefined) {
                daysMap[dayName] = {
                    total_sales: parseInt(dayData.total_sales, 10),
                    total_revenue: parseFloat(dayData.total_revenue)
                };
            }
        });

        const daysResult = Object.entries(daysMap).map(([day, metrics]) => ({
            day,
            ...metrics
        }));

        // ---------- Monthly sales (only for year or all) ----------
        let monthlySales = [];
        if (['year', 'all'].includes(duration.toLowerCase())) {
            const monthlyRaw = await Sales.findAll({
                where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id, status: "active" },
                attributes: [
                    [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'YYYY-MM'), 'month'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_orders'],
                    [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue']
                ],
                group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'YYYY-MM')],
                order: [[Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'YYYY-MM'), 'ASC']],
                raw: true
            });

            // Calculate total_cost per month from products
            const monthlyCostData = await Sales.findAll({
                where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id, status: "active" },
                attributes: [
                    [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'YYYY-MM'), 'month'],
                    'products'
                ],
                raw: true
            });

            const monthlyCostMap = {};
            monthlyCostData.forEach(row => {
                const month = row.month;
                if (!monthlyCostMap[month]) monthlyCostMap[month] = 0;

                let products = row.products || [];
                if (typeof products === 'string') {
                    try { products = JSON.parse(products); } catch { products = []; }
                }

                products.forEach(p => {
                    const qty = parseFloat(p.quantity) || 0;
                    const cost = parseFloat(p.buying_price) || 0;
                    monthlyCostMap[month] += cost * qty;
                });
            });

            monthlySales = monthlyRaw.map(m => ({
                month: m.month,
                total_orders: parseInt(m.total_orders, 10),
                total_revenue: parseFloat(m.total_revenue),
                total_cost: Number((monthlyCostMap[m.month] || 0).toFixed(2)),
                profit: Number((parseFloat(m.total_revenue) - (monthlyCostMap[m.month] || 0)).toFixed(2))
            }));
        }

        // ---------- Damages ----------
        const damages = await Damage.findAll({
            where: { createdAt: { [Op.between]: [startTime, endTime] }, business_id },
        });
        console.log(monthlySales)
        // Final response
        res.json({
            summary: {
                total_orders: parseInt(totalMetrics.total_orders || 0, 10),
                total_revenue: parseFloat(totalMetrics.total_revenue || 0),
                total_products: uniqueProducts.size,
                net_profit: Number(netProfit.toFixed(2)),
                start_date: rangeStart,
                end_date: rangeEnd,
                business_id,
                damages: damages.length,
                display_products: displayProducts
            },
            hourly_sales: hourlyResult,
            top_products: topProducts, // Now includes revenue, cost, profit
            sellers: formattedSellers,
            daily_sales: daysResult,
            monthly_sales: monthlySales // Only sent when duration = year or all
        });

    } catch (error) {
        console.error("Sales analytics error:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
});

// get all sales (unchanged)
router.get('/get_all_sales', async (req, res) => {
    const { business_id, duration = 'week', seller_id, start_date, end_date, limit } = req.query;
    try {
        const whereClause = { business_id, status: "active" };

        if (seller_id && seller_id !== 'all') {
            whereClause.seller_id = seller_id;
        }

        const { start, end } = getDateRange(duration, start_date, end_date);

        if (duration.toLowerCase() !== 'all') {
            whereClause.createdAt = {
                [Op.between]: [start, end]
            };
        }

        const sales = await Sales.findAll({
            where: whereClause,
            limit: limit ? parseInt(limit) : 10,
            order: [['createdAt', 'DESC']]
        });

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

module.exports = router;