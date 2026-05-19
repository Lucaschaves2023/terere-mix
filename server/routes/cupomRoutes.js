/* ============================================
   Tereré Mix — Cupom Routes
   /api/cupons
   ============================================ */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cupomController');

// Validar cupom (POST antes de /:id para evitar conflito)
router.post('/validar', ctrl.validar);

// CRUD
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/',   ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.excluir);

module.exports = router;
