const { Router } = require('express');
const ctrl = require('../controllers/analyticsController');

const router = Router();

router.get('/dashboard',   ctrl.getDashboard);
router.get('/relatorios',  ctrl.getRelatorios);

module.exports = router;
