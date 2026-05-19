const { Router } = require('express');
const ctrl = require('../controllers/pedidoController');

const router = Router();

router.get('/',                  ctrl.listar);
router.get('/:id',               ctrl.buscarPorId);
router.post('/',                 ctrl.criar);
router.patch('/:id/status',      ctrl.atualizarStatus);

module.exports = router;
