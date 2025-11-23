const User = require('../models/userModel');

// @desc    Отримати всіх користувачів (без паролів)
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        // Виключаємо поле password з вибірки
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Змінити роль користувача
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Забороняємо змінювати роль самому собі (щоб не заблокувати себе)
        if (req.user._id.toString() === id) {
            return res.status(400).json({ success: false, message: 'Ви не можете змінити роль самому собі' });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};