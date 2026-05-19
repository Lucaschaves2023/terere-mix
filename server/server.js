/* ============================================
   Tereré Mix — Server (desenvolvimento local)
   Importa o app Express e inicia app.listen.
   Em produção (Vercel), este arquivo NÃO é usado —
   o Vercel usa api/index.js como entry point.
   ============================================ */

const app  = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🧉 Tereré Mix rodando em http://localhost:${PORT}`);
  console.log(`   Cardápio     → http://localhost:${PORT}/index.html`);
  console.log(`   Admin Panel  → http://localhost:${PORT}/admin.html`);
  console.log(`   API Health   → http://localhost:${PORT}/api/health\n`);
});
