const { Router } = require('express');
const ctrl = require('../controllers/empresaController');

const router = Router();

router.get('/', ctrl.getEmpresa);
router.put('/', ctrl.updateEmpresa);

module.exports = router;
