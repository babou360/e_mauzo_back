const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const { Sales } = require('../models');

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
    const { duration = 'day', start, end, business_id } = req.query;
    try {
        // Validate business_id
        if (!business_id) {
            return res.status(400).json({error: "business_id is required"});
        }

        // Get the date range
        const { start: rangeStart, end: rangeEnd } = getDateRange(duration, start, end);
        
        // Set time range (full days)
        const startTime = new Date(rangeStart);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(rangeEnd);
        endTime.setHours(23, 59, 59, 999);

        // Verify the Sales model is properly connected
        if (!Sales) {
            throw new Error("Sales model is not properly initialized");
        }

        // Get column definitions to check for products and seller columns
        const modelAttributes = Sales.rawAttributes;
        const productsColumnType = modelAttributes.products?.type;
        const hasSellerColumn = !!modelAttributes.seller;
        const hasBusinessIdColumn = !!modelAttributes.business_id;

        // Verify business_id column exists
        if (!hasBusinessIdColumn) {
            throw new Error("business_id column not found in Sales table");
        }

        // Get total metrics for the time range with business_id filter
        const totalMetrics = await Sales.findOne({
            where: {
                createdAt: { [Op.between]: [startTime, endTime] },
                business_id
            },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_orders'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.fn('array_length', Sequelize.col('products'), 1)), 0), 'total_products']
            ],
            raw: true
        });

        // Get hourly sales metrics
        const hourlySales = await Sales.findAll({
            where: {
                createdAt: { [Op.between]: [startTime, endTime] },
                business_id
            },
            attributes: [
                [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00'), 'hour'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_sales'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.fn('array_length', Sequelize.col('products'), 1)), 0), 'total_products']
            ],
            group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00')],
            order: [[Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'HH24:00'), 'ASC']],
            raw: true
        });

        // Initialize result structure for 00:00 to 23:00 (24 hours)
        const hourlyResult = Array.from({ length: 24 }, (_, i) => {
            const hour = i.toString().padStart(2, '0') + ':00';
            return {
                hour,
                total_sales: 0,
                total_revenue: 0,
                total_products: 0
            };
        });

        // Process hourly sales data with +3 hour offset
        hourlySales.forEach(sale => {
            const hour = sale.hour;
            const hourIndex = parseInt(hour.split(':')[0], 10);
            const shiftedHourIndex = (hourIndex + 3) % 24; // Apply +3 hour offset
            if (shiftedHourIndex >= 0 && shiftedHourIndex < 24) {
                hourlyResult[shiftedHourIndex] = {
                    hour: shiftedHourIndex.toString().padStart(2, '0') + ':00',
                    total_sales: parseInt(sale.total_sales, 10),
                    total_revenue: parseFloat(sale.total_revenue),
                    total_products: parseInt(sale.total_products, 10)
                };
            }
        });

        // Get top products (assuming products is a JSONB array)
        let topProducts = [];
        if (productsColumnType instanceof Sequelize.JSONB || productsColumnType instanceof Sequelize.JSON) {
            topProducts = await Sales.findAll({
                where: {
                    createdAt: { [Op.between]: [startTime, endTime] },
                    business_id
                },
                attributes: [
                    [Sequelize.literal(`jsonb_array_elements(products)->>'name'`), 'product_name'],
                    [Sequelize.fn('COUNT', Sequelize.literal('*')), 'count']
                ],
                group: [Sequelize.literal(`jsonb_array_elements(products)->>'name'`)],
                order: [[Sequelize.literal('count'), 'DESC']],
                limit: 10,
                raw: true
            });
        } else if (productsColumnType instanceof Sequelize.ARRAY) {
            topProducts = await Sales.findAll({
                where: {
                    createdAt: { [Op.between]: [startTime, endTime] },
                    business_id
                },
                attributes: [
                    [Sequelize.literal(`(unnest(products))->>'name'`), 'product_name'],
                    [Sequelize.fn('COUNT', Sequelize.literal('*')), 'count']
                ],
                group: [Sequelize.literal(`(unnest(products))->>'name'`)],
                order: [[Sequelize.literal('count'), 'DESC']],
                limit: 10,
                raw: true
            });
        }

        // Format top products
        const formattedTopProducts = topProducts.map(product => ({
            product: product.product_name,
            count: parseInt(product.count, 10)
        }));

        // Get seller analytics only if seller column exists
        let formattedSellers = [];
        if (hasSellerColumn) {
            const sellerAnalytics = await Sales.findAll({
                where: {
                    createdAt: { [Op.between]: [startTime, endTime] },
                    business_id,
                    seller: { [Op.ne]: null }
                },
                attributes: [
                    [Sequelize.literal(`seller->>'name'`), 'seller_name'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_orders'],
                    [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue'],
                    [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.fn('array_length', Sequelize.col('products'), 1)), 0), 'total_products']
                ],
                group: [Sequelize.literal(`seller->>'name'`)],
                order: [[Sequelize.literal('total_revenue'), 'DESC']],
                raw: true
            });

            formattedSellers = sellerAnalytics.map(seller => ({
                seller_name: seller.seller_name,
                total_orders:  parseInt(seller.total_orders, 10),
                total_revenue: parseFloat(seller.total_revenue),
                total_products: parseInt(seller.total_products, 10)
            }));
        }

        // Get daily sales data
        const dailySales = await Sales.findAll({
            where: {
                createdAt: { [Op.between]: [startTime, endTime] },
                business_id
            },
            attributes: [
                [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Day'), 'day'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_sales'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_price')), 0), 'total_revenue'],
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.fn('array_length', Sequelize.col('products'), 1)), 0), 'total_products']
            ],
            group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Day')],
            raw: true
        });

        // Initialize days structure
        const daysMap = {
            'Monday': { total_sales: 0, total_revenue: 0, total_products: 0 },
            'Tuesday': { total_sales: 0, total_revenue: 0, total_products: 0 },
            'Wednesday': { total_sales: 0, total_revenue: 0, total_products: 0 },
            'Thursday': { total_sales: 0, total_revenue: 0, total_products: 0 },
            'Friday': { total_sales: 0, total_revenue: 0, total_products: 0 },
            'Saturday': { total_sales: 0, total_revenue: 0, total_products: 0 },
            'Sunday': { total_sales: 0, total_revenue: 0, total_products: 0 }
        };

        // Process daily sales data
        dailySales.forEach(dayData => {
            const dayName = dayData.day.trim(); // Remove padding from TO_CHAR
            if (daysMap.hasOwnProperty(dayName)) {
                daysMap[dayName] = {
                    total_sales: parseInt(dayData.total_sales, 10),
                    total_revenue: parseFloat(dayData.total_revenue),
                    total_products: parseInt(dayData.total_products, 10)
                };
            }
        });

        // Format days result
        const daysResult = Object.entries(daysMap).map(([day, metrics]) => ({
            day,
            ...metrics
        }));

        // Final response
        res.json({
            summary: {
                total_orders: parseInt(totalMetrics.total_orders || 0, 10),
                total_revenue: parseFloat(totalMetrics.total_revenue || 0),
                total_products: parseInt(totalMetrics.total_products || 0, 10),
                start_date: rangeStart,
                end_date: rangeEnd,
                business_id
            },
            hourly_sales: hourlyResult,
            top_products: formattedTopProducts,
            sellers: formattedSellers,
            daily_sales: daysResult
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;