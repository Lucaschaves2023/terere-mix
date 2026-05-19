const { Router } = require('express');
const ctrl = require('../controllers/estoqueController');

const router = Router();

router.get('/',                 ctrl.listar);
router.post('/entrada',         ctrl.registrarEntrada);
router.get('/movimentacoes',    ctrl.listarMovimentacoes);

module.exports = router;
