/* ============================================
   Tereré Mix — Horário Controller
   GET /api/horarios  → público
   PUT /api/horarios  → admin
   ============================================ */

const { db } = require('../models/db');

const NOMES_DIA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

async function garantirHorarios() {
  for (let i = 0; i < 7; i++) {
    await db.exec(
      `INSERT INTO horarios_funcionamento (dia_semana, aberto, hora_abre, hora_fecha)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (dia_semana) DO NOTHING`,
      [i, i === 0, '16:00', '23:50']
    );
  }
}

async function listar(req, res) {
  try {
    await garantirHorarios();
    const horarios = await db.all(
      'SELECT * FROM horarios_funcionamento ORDER BY dia_semana'
    );
    const dados = horarios.map(h => ({ ...h, nome_dia: NOMES_DIA[h.dia_semana] }));
    res.json({ success: true, data: dados });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const { horarios } = req.body;
    if (!Array.isArray(horarios) || horarios.length === 0) {
      return res.status(400).json({ success: false, message: 'Envie um array de horários.' });
    }
    for (const h of horarios) {
      const dia = parseInt(h.dia_semana);
      if (isNaN(dia) || dia < 0 || dia > 6) continue;
      await db.exec(
        `UPDATE horarios_funcionamento
         SET aberto = ?, hora_abre = ?, hora_fecha = ?, atualizado_em = now()
         WHERE dia_semana = ?`,
        [h.aberto ? true : false, h.hora_abre || null, h.hora_fecha || null, dia]
      );
    }
    const updated = await db.all(
      'SELECT * FROM horarios_funcionamento ORDER BY dia_semana'
    );
    res.json({
      success: true,
      data: updated.map(h => ({ ...h, nome_dia: NOMES_DIA[h.dia_semana] })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listar, atualizar };
