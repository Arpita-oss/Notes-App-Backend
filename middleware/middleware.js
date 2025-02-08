import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const middleware = async (req, res, next) => {
    try {
        // Verify JWT_SECRET is available
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not available in middleware');
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        const authHeader = req.headers.authorization;
        console.log("Auth header:", authHeader); // Debug log

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No authorization header found"
            });
        }

        const token = authHeader.split(' ')[1];
        console.log("Token to verify:", token); // Debug log

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded token:", decoded); // Debug log

            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            req.user = {
                id: user._id,
                name: user.name
            };
            next();
        } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
    } catch (error) {
        console.error('Middleware error:', error);
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

export default middleware;