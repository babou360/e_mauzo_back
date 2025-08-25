const jwt = require('jsonwebtoken');
const { User } = require('../models/index')

const authMiddleware = async (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }else{
        if(token.startsWith("Bearer ")){
            token = token.slice(7).trim();
            try {
                const currentTime = new Date();
                const decoded = jwt.decode(token, { complete: true });
        
                if (!decoded || !decoded.payload) {
                    return res.status(401).json({ error: "Invalid token" });
                }else{
                    const user = decoded.payload;
                    const timestampDate = new Date(user.exp * 1000);
                    if (timestampDate < currentTime) {
                        return res.status(401).json({ error: "Unauthorized: Token expired" });
                    }
            
                    //req.user = user;
                    const user1 = await User.findOne({
                        where: {phone: user.phone}
                    })
                    req.user = user1
                    next();
                }
            } catch (error) {
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }
        }else{
            token = token.slice(7).trim();
            try {
                const currentTime = new Date();
                const decoded = jwt.decode(token, { complete: true });
        
                if (!decoded || !decoded.payload) {
                    return res.status(401).json({ error: "Invalid token" });
                }else{
                    const user = decoded.payload;
                    const timestampDate = new Date(user.exp * 1000);
                    if (timestampDate < currentTime) {
                        return res.status(401).json({ error: "Unauthorized: Token expired" });
                    }
            
                    req.user = user; // Attach user info to request
                    next();
                }
            } catch (error) {
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }
        }
    }
};

module.exports = authMiddleware;
