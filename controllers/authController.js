const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// @desc    Реєстрація нового користувача
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Користувач з таким email вже існує' });
        }
        // За замовчуванням створюється 'user'. Щоб створити адміна, треба змінити вручну в БД або через seed
        await User.create({ email, password });
        res.status(201).json({ success: true, message: 'Реєстрація успішна' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Вхід користувача
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Будь ласка, введіть email та пароль' });
        }

        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            const token = jwt.sign(
                { id: user._id, role: user.role }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1d' }
            );
            // Повертаємо роль на клієнт
            res.json({ success: true, token, role: user.role, email: user.email });
        } else {
            res.status(401).json({ success: false, message: 'Невірний email або пароль' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
};