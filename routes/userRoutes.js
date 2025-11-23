const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Middleware для перевірки, чи користувач є адміном
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Доступ дозволено тільки адміністраторам' });
    }
};

router.use(protect); // Всі роути захищені токеном
router.use(adminOnly); // Всі роути тільки для адміна

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);

module.exports = router;