const express = require('express');
const router = express.Router();
const {
    getAllPersonnel,
    getPersonnelById,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    getStatistics,
    getUnits
} = require('../controllers/personnelController');
const { protect } = require('../middleware/authMiddleware');

// Всі маршрути захищені токеном
router.use(protect);

// Специфічні маршрути повинні бути ПЕРЕД динамічними (/:id)
router.get('/units', getUnits);
router.get('/statistics', getStatistics);

router.route('/')
    .get(getAllPersonnel)
    .post(createPersonnel);

router.route('/:id')
    .get(getPersonnelById)
    .put(updatePersonnel)
    .delete(deletePersonnel);

module.exports = router;