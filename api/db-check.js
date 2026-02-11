/**
 * Endpoint de diagnóstico - testa conexão com o banco e conta clientes
 * Acesse: https://seu-dominio.vercel.app/api/db-check
 */
const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  };

  if (!config.host || !config.user || !config.database) {
    return res.status(503).json({
      ok: false,
      error: 'Variáveis de ambiente incompletas',
      config,
      message: 'Configure DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no Vercel.',
    });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM clientes');
    const total = rows[0]?.total ?? 0;

    return res.status(200).json({
      ok: true,
      message: 'Conexão com o banco OK',
      totalClientes: total,
      database: process.env.DB_NAME,
    });
  } catch (err) {
    console.error('db-check error:', err.message);
    return res.status(503).json({
      ok: false,
      error: err.message,
      hint: err.code === 'ER_ACCESS_DENIED_ERROR'
        ? 'Verifique usuário/senha ou permissões no MySQL.'
        : err.code === 'ER_BAD_DB_ERROR'
        ? 'O banco não existe ou o usuário não tem permissão.'
        : 'Verifique se o MySQL aceita conexões remotas (porta 3306 e bind-address).',
    });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
};
