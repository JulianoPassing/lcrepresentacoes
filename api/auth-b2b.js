// API de autenticação B2B para clientes LC Representações
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// SENHA PADRÃO: 123456
// CNPJs com senhas personalizadas (opcional)
const senhasPersonalizadas = {
  // '29765338000116': 'outrasenha',
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { cnpj, password } = req.body;
    if (!cnpj || !password) {
      return res.status(400).json({ success: false, message: 'CNPJ e senha são obrigatórios' });
    }
    if (typeof cnpj !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Dados de entrada inválidos' });
    }

    const cnpjNormalizado = cnpj.replace(/[.\-\/\s]/g, '');
    const senhaEsperada = senhasPersonalizadas[cnpjNormalizado] || '123456';

    if (password !== senhaEsperada) {
      await new Promise(r => setTimeout(r, 1000));
      return res.status(401).json({ success: false, message: 'Senha inválida' });
    }

    let cliente = null;
    let connection = null;

    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lc_representacoes'
      });

      const [rows] = await connection.execute(
        'SELECT * FROM clientes WHERE cnpj = ? OR REPLACE(REPLACE(REPLACE(REPLACE(cnpj, ".", ""), "/", ""), "-", ""), " ", "") = ?',
        [cnpj, cnpjNormalizado]
      );

      if (rows.length > 0) cliente = rows[0];
    } catch (dbError) {
      try {
        const jsonPath = path.join(__dirname, '../public/clientes.json');
        const data = fs.readFileSync(jsonPath, 'utf8');
        const clientes = JSON.parse(data);

        cliente = clientes.find(c => {
          if (!c.cnpj) return false;
          const n = c.cnpj.replace(/[.\-\/\s]/g, '');
          return n === cnpjNormalizado;
        });
        if (!cliente) {
          cliente = clientes.find(c => c.cnpj === cnpj);
        }
      } catch (_) {}
    } finally {
      if (connection) await connection.end();
    }

    if (cliente) {
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        cliente: {
          id: cliente.id,
          razao: cliente.razao,
          cnpj: cliente.cnpj,
          ie: cliente.ie,
          endereco: cliente.endereco,
          bairro: cliente.bairro,
          cidade: cliente.cidade,
          estado: cliente.estado,
          cep: cliente.cep,
          email: cliente.email,
          telefone: cliente.telefone,
          transporte: cliente.transporte,
          prazo: cliente.prazo,
          obs: cliente.obs
        }
      });
    }

    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ success: false, message: 'Cliente não encontrado no sistema' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
