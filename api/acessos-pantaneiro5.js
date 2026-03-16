// API para gerenciar acessos à tabela Pantaneiro 5 (usa MySQL - Vercel tem filesystem read-only)
const mysql = require('mysql2/promise');

const addSecurityHeaders = (res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
};

function normalizarCnpj(cnpj) {
  return (cnpj || '').toString().replace(/[.\-\/\s]/g, '');
}

async function getConnection() {
  try {
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lc_representacoes'
    });
  } catch (e) {
    return null;
  }
}

async function carregarAcessos(conn) {
  try {
    const [rows] = await conn.execute(
      'SELECT tipo, valor FROM acessos_pantaneiro5'
    );
    const cnpjs = rows.filter(r => r.tipo === 'cnpj').map(r => r.valor);
    const usuarios = rows.filter(r => r.tipo === 'usuario').map(r => r.valor);
    return { cnpjs, usuarios };
  } catch (e) {
    return { cnpjs: [], usuarios: [] };
  }
}

module.exports = async (req, res) => {
  addSecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  let connection = null;

  try {
    connection = await getConnection();
    if (!connection) {
      return res.status(503).json({
        error: 'Banco de dados indisponível. Configure DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no Vercel.',
        acessos: { cnpjs: [], usuarios: [] }
      });
    }

    let acessos = await carregarAcessos(connection);

    if (req.method === 'GET') {
      return res.status(200).json(acessos);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { tipo, valor } = body;
      if (!tipo || !valor) {
        return res.status(400).json({ error: 'Informe tipo (cnpj ou usuario) e valor' });
      }
      const v = (valor || '').toString().trim().toLowerCase();
      if (!v) return res.status(400).json({ error: 'Valor inválido' });

      if (tipo === 'cnpj') {
        const cnpjNorm = normalizarCnpj(valor);
        if (cnpjNorm.length < 14) return res.status(400).json({ error: 'CNPJ inválido' });
        if (!acessos.cnpjs.includes(cnpjNorm)) {
          await connection.execute(
            'INSERT IGNORE INTO acessos_pantaneiro5 (tipo, valor) VALUES (?, ?)',
            ['cnpj', cnpjNorm]
          );
          acessos = await carregarAcessos(connection);
        }
        return res.status(200).json({ message: 'CNPJ adicionado', acessos });
      }
      if (tipo === 'usuario') {
        if (!acessos.usuarios.includes(v)) {
          await connection.execute(
            'INSERT IGNORE INTO acessos_pantaneiro5 (tipo, valor) VALUES (?, ?)',
            ['usuario', v]
          );
          acessos = await carregarAcessos(connection);
        }
        return res.status(200).json({ message: 'Usuário adicionado', acessos });
      }
      return res.status(400).json({ error: 'Tipo deve ser cnpj ou usuario' });
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body || '{}'); } catch(_) { return {}; } })() : (req.body || {});
      const tipo = (req.query?.tipo || body.tipo || '').toString().toLowerCase();
      const valor = req.query?.valor || body.valor;

      if (!tipo || !valor) {
        return res.status(400).json({ error: 'Informe tipo (cnpj ou usuario) e valor' });
      }

      const v = (valor || '').toString().trim().toLowerCase();
      if (tipo === 'cnpj') {
        const cnpjNorm = normalizarCnpj(valor);
        await connection.execute(
          'DELETE FROM acessos_pantaneiro5 WHERE tipo = ? AND valor = ?',
          ['cnpj', cnpjNorm]
        );
        acessos = await carregarAcessos(connection);
        return res.status(200).json({ message: 'CNPJ removido', acessos });
      }
      if (tipo === 'usuario') {
        await connection.execute(
          'DELETE FROM acessos_pantaneiro5 WHERE tipo = ? AND valor = ?',
          ['usuario', v]
        );
        acessos = await carregarAcessos(connection);
        return res.status(200).json({ message: 'Usuário removido', acessos });
      }
      return res.status(400).json({ error: 'Tipo deve ser cnpj ou usuario' });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Erro acessos-pantaneiro5:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};
