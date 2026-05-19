const { Router } = require('express');
const ctrl   = require('../controllers/horarioController');
const router = Router();

router.get('/', ctrl.listar);
router.put('/', ctrl.atualizar);

module.exports = router;
