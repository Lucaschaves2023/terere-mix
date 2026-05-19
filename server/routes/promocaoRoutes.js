const { Router } = require('express');
const ctrl   = require('../controllers/promocaoController');
const router = Router();

router.get('/',       ctrl.listar);
router.post('/',      ctrl.criar);
router.put('/:id',    ctrl.atualizar);
router.delete('/:id', ctrl.excluir);

module.exports = router;
