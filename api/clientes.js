const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const addSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
};

const validateClienteData = (data) => {
  const errors = [];
  if (!data.razao || data.razao.trim().length < 2) {
    errors.push('Razão social é obrigatória e deve ter pelo menos 2 caracteres');
  }
  if (data.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/.test(data.cnpj)) {
    errors.push('CNPJ deve estar em formato válido');
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email deve estar em formato válido');
  }
  return errors;
};

const carregarClientesJSON = () => {
  try {
    const jsonPath = path.join(__dirname, '../public/clientes.json');
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar clientes.json:', error);
    return [];
  }
};

module.exports = async (req, res) => {
  addSecurityHeaders(res);

  let connection = null;
  let useJSON = false;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lc_representacoes'
    });
  } catch (dbError) {
    console.log('Erro ao conectar com MySQL, usando arquivo JSON:', dbError.message);
    useJSON = true;
  }

  try {
    let id = null;
    if (req.headers['x-vercel-path']) {
      const pathParts = req.headers['x-vercel-path'].split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && !isNaN(lastPart)) id = lastPart;
    }
    if (!id && req.url) {
      const urlWithoutQuery = req.url.split('?')[0];
      const urlParts = urlWithoutQuery.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && !isNaN(lastPart)) id = lastPart;
    }

    if (useJSON) {
      if (req.method === 'GET' && !id) {
        const clientes = carregarClientesJSON();
        return res.status(200).json(clientes);
      }
      return res.status(503).json({
        error: 'Banco de dados não configurado. Configure DB_HOST, DB_USER, DB_PASSWORD e DB_NAME nas variáveis de ambiente.'
      });
    }

    if (req.method === 'POST') {
      const validationErrors = validateClienteData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
      }
      const { razao, cnpj, ie, endereco, bairro, cidade, estado, cep, email, telefone, transporte, prazo, obs } = req.body;
      const sanitizedData = {
        razao: razao?.trim(),
        cnpj: cnpj?.replace(/\D/g, ''),
        ie: ie?.trim(),
        endereco: endereco?.trim(),
        bairro: bairro?.trim(),
        cidade: cidade?.trim(),
        estado: estado?.trim(),
        cep: cep?.replace(/\D/g, ''),
        email: email?.toLowerCase().trim(),
        telefone: telefone?.replace(/\D/g, ''),
        transporte: transporte?.trim(),
        prazo: prazo?.trim(),
        obs: obs?.trim()
      };
      const [result] = await connection.execute(
        `INSERT INTO clientes (razao, cnpj, ie, endereco, bairro, cidade, estado, cep, email, telefone, transporte, prazo, obs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(sanitizedData)
      );
      return res.status(201).json({ id: result.insertId, message: 'Cliente cadastrado com sucesso!', data: { id: result.insertId, ...sanitizedData } });
    }

    if (req.method === 'PUT' && id) {
      const { razao, cnpj, ie, endereco, bairro, cidade, estado, cep, email, telefone, transporte, prazo, obs } = req.body;
      const [result] = await connection.execute(
        `UPDATE clientes SET razao=?, cnpj=?, ie=?, endereco=?, bairro=?, cidade=?, estado=?, cep=?, email=?, telefone=?, transporte=?, prazo=?, obs=? WHERE id=?`,
        [razao, cnpj, ie, endereco, bairro, cidade, estado, cep, email, telefone, transporte, prazo, obs, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
      return res.status(200).json({ message: 'Cliente atualizado com sucesso!' });
    }

    if (req.method === 'DELETE' && id) {
      const [result] = await connection.execute('DELETE FROM clientes WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
      return res.status(200).json({ message: 'Cliente removido com sucesso!' });
    }

    if (req.method === 'GET' && id) {
      const [rows] = await connection.execute('SELECT * FROM clientes WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'GET') {
      const [rows] = await connection.execute('SELECT * FROM clientes ORDER BY id');
      return res.status(200).json(rows);
    }

    res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    console.error('Erro na API de clientes:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};
