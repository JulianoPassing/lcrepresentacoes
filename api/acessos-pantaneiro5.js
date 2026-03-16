// API para gerenciar acessos à tabela Pantaneiro 5
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../public/acessos-pantaneiro5.json');

const addSecurityHeaders = (res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
};

function carregarAcessos() {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return {
      cnpjs: Array.isArray(parsed.cnpjs) ? parsed.cnpjs : [],
      usuarios: Array.isArray(parsed.usuarios) ? parsed.usuarios : []
    };
  } catch (e) {
    return { cnpjs: [], usuarios: [] };
  }
}

function salvarAcessos(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizarCnpj(cnpj) {
  return (cnpj || '').toString().replace(/[.\-\/\s]/g, '');
}

module.exports = async (req, res) => {
  addSecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let acessos = carregarAcessos();

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
          acessos.cnpjs.push(cnpjNorm);
          salvarAcessos(acessos);
        }
        return res.status(200).json({ message: 'CNPJ adicionado', acessos });
      }
      if (tipo === 'usuario') {
        if (!acessos.usuarios.includes(v)) {
          acessos.usuarios.push(v);
          salvarAcessos(acessos);
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
        acessos.cnpjs = acessos.cnpjs.filter(c => c !== cnpjNorm);
        salvarAcessos(acessos);
        return res.status(200).json({ message: 'CNPJ removido', acessos });
      }
      if (tipo === 'usuario') {
        acessos.usuarios = acessos.usuarios.filter(u => u !== v);
        salvarAcessos(acessos);
        return res.status(200).json({ message: 'Usuário removido', acessos });
      }
      return res.status(400).json({ error: 'Tipo deve ser cnpj ou usuario' });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Erro acessos-pantaneiro5:', err);
    res.status(500).json({ error: err.message });
  }
};
