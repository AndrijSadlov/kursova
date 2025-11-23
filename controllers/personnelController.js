const MilitaryPersonnel = require('../models/militaryPersonnelModel');
const mongoose = require('mongoose');

// @desc    Отримати список унікальних підрозділів
// @route   GET /api/personnel/units
exports.getUnits = async (req, res) => {
    try {
        const units = await MilitaryPersonnel.distinct('unit');
        res.json({ success: true, data: units });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Отримати всіх військовослужбовців
// @route   GET /api/personnel
exports.getAllPersonnel = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', unit = '' } = req.query;
        let query = {};

        // Фільтрація по підрозділу
        if (unit) {
            query.unit = unit;
        }

        if (search) {
            query.$or = [
                { lastName: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { militaryId: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const personnel = await MilitaryPersonnel.find(query).limit(parseInt(limit)).skip(skip).sort({ createdAt: -1 });
        const total = await MilitaryPersonnel.countDocuments(query);

        res.json({
            success: true,
            data: personnel,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Отримати військовослужбовця за ID
// @route   GET /api/personnel/:id
exports.getPersonnelById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Невірний ID' });
        }
        const personnel = await MilitaryPersonnel.findById(id);
        if (!personnel) {
            return res.status(404).json({ success: false, message: 'Військовослужбовця не знайдено' });
        }
        res.json({ success: true, data: personnel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Створити нового військовослужбовця
// @route   POST /api/personnel
exports.createPersonnel = async (req, res) => {
    // Тільки адмін може створювати
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Тільки адміністратор може додавати персонал' });
    }

    try {
        const personnel = await MilitaryPersonnel.create(req.body);
        res.status(201).json({ success: true, data: personnel });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ success: false, message: 'Військовий ID вже існує' });
        } else if (error.name === 'ValidationError') {
            res.status(400).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    }
};

// @desc    Оновити дані військовослужбовця
// @route   PUT /api/personnel/:id
exports.updatePersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Невірний ID' });
        }

        const userRole = req.user.role;
        let updateData = req.body;

        // Перевірка прав: звичайний юзер може міняти ТІЛЬКИ статус
        if (userRole !== 'admin') {
            // Якщо користувач намагається змінити щось крім статусу, ми це ігноруємо або кидаємо помилку.
            // Тут зробимо суворіше: дозволимо запит тільки якщо там лише статус.
            if (Object.keys(req.body).length > 1 || !req.body.status) {
                 // Або, альтернативно, просто відфільтруємо об'єкт:
                 updateData = { status: req.body.status };
            } else {
                 updateData = { status: req.body.status };
            }
            
            // Якщо статусу немає в тілі запиту, то нічого оновлювати
            if (!updateData.status) {
                 return res.status(403).json({ success: false, message: 'Ви можете змінювати лише статус' });
            }
        }

        const updatedPersonnel = await MilitaryPersonnel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedPersonnel) {
            return res.status(404).json({ success: false, message: 'Військовослужбовця не знайдено' });
        }
        res.json({ success: true, data: updatedPersonnel });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
};

// @desc    Видалити військовослужбовця
// @route   DELETE /api/personnel/:id
exports.deletePersonnel = async (req, res) => {
    // Тільки адмін може видаляти
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Тільки адміністратор може видаляти записи' });
    }

    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Невірний ID' });
        }
        const personnel = await MilitaryPersonnel.findByIdAndDelete(id);
        if (!personnel) {
            return res.status(404).json({ success: false, message: 'Військовослужбовця не знайдено' });
        }
        res.json({ success: true, message: 'Військовослужбовця видалено успішно' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
};

// @desc    Отримати статистику
// @route   GET /api/personnel/statistics
exports.getStatistics = async (req, res) => {
    try {
        const { unit } = req.query;
        
        // Базовий запит для фільтрації
        let baseQuery = {};
        if (unit) baseQuery.unit = unit;

        // Для агрегації (графіків)
        let matchStage = {};
        if (unit) matchStage.unit = unit;

        const [
            totalPersonnel, activePersonnel, inactivePersonnel, onLeave, rankStats, unitStats, bloodTypeStats, recentAdditions
        ] = await Promise.all([
            MilitaryPersonnel.countDocuments(baseQuery),
            MilitaryPersonnel.countDocuments({ ...baseQuery, status: 'active' }),
            MilitaryPersonnel.countDocuments({ ...baseQuery, status: 'inactive' }),
            MilitaryPersonnel.countDocuments({ ...baseQuery, status: 'leave' }),
            MilitaryPersonnel.aggregate([
                { $match: matchStage },
                { $group: { _id: '$rank', count: { $sum: 1 } } },
                { $sort: { count: -1 } }, { $limit: 5 }
            ]),
            MilitaryPersonnel.aggregate([
                { $match: matchStage },
                { $group: { _id: '$unit', count: { $sum: 1 } } },
                { $sort: { count: -1 } }, { $limit: 5 }
            ]),
            MilitaryPersonnel.aggregate([
                { $match: { ...matchStage, 'medicalInfo.bloodType': { $ne: null, $ne: "" } } },
                { $group: { _id: '$medicalInfo.bloodType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Останні додані теж фільтруємо по підрозділу
            MilitaryPersonnel.find(baseQuery).sort({ createdAt: -1 }).limit(5).select('firstName lastName rank createdAt')
        ]);

        res.json({
            success: true,
            data: { total: totalPersonnel, active: activePersonnel, inactive: inactivePersonnel, onLeave, rankStats, unitStats, bloodTypeStats, recentAdditions }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка отримання статистики' });
    }
};