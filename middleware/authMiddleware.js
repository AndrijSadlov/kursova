// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Отримуємо токен з заголовка
            token = req.headers.authorization.split(' ')[1];

            // Верифікуємо токен
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Знаходимо користувача за ID з токена і додаємо до запиту
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Немає авторизації, токен невірний' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Немає авторизації, немає токена' });
    }
};

module.exports = { protect };