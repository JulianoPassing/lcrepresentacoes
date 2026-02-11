const mysql = require('mysql2/promise');
const emailNotification = require('./notifications/email');

const operationCache = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of operationCache.entries()) {
    if (now - timestamp > 5 * 60 * 1000) operationCache.delete(key);
  }
}, 60 * 1000);

module.exports = async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lc_representacoes'
    });
  } catch (dbErr) {
    console.error('Erro ao conectar MySQL:', dbErr.message);
    return res.status(503).json({
      error: 'Banco de dados não configurado. Configure DB_HOST, DB_USER, DB_PASSWORD e DB_NAME nas variáveis de ambiente.'
    });
  }

  try {
    const urlParts = (req.url || '').split('/');
    const idFromUrl = urlParts[urlParts.length - 1];
    const isNumericId = /^\d+$/.test(idFromUrl);

    if (req.method === 'POST') {
      const { id, empresa, descricao, dados } = req.body || {};
      if (id) {
        return res.status(400).json({ error: 'Use PUT para atualizar pedido existente.', correctMethod: 'PUT' });
      }
      const empresaFinal = empresa !== undefined ? empresa : null;
      const descricaoFinal = descricao !== undefined ? descricao : null;
      const dadosFinal = dados !== undefined ? JSON.stringify(dados) : JSON.stringify({});

      const [result] = await connection.execute(
        `INSERT INTO pedidos (empresa, descricao, dados, data_pedido) VALUES (?, ?, ?, NOW())`,
        [empresaFinal, descricaoFinal, dadosFinal]
      );

      emailNotification.notifyNewOrder({
        id: result.insertId,
        empresa: empresaFinal,
        descricao: descricaoFinal,
        dados: dadosFinal,
        origem: 'normal'
      }).catch(err => console.error('Erro ao enviar notificação:', err));

      return res.status(201).json({ id: result.insertId, message: 'Pedido cadastrado com sucesso!' });
    }

    if (req.method === 'PUT') {
      const { id: idBody, empresa, descricao, dados, operationId: bodyOpId } = req.body || {};
      const id = isNumericId ? parseInt(idFromUrl) : idBody;
      const operationId = req.headers['x-operation-id'] || bodyOpId || 'sem-id';

      const cacheKey = `PUT_${id}_${operationId}`;
      if (operationCache.has(cacheKey)) {
        return res.status(200).json({ success: true, message: 'Operação já processada', cached: true });
      }
      operationCache.set(cacheKey, Date.now());

      const [existingCheck] = await connection.execute('SELECT id FROM pedidos WHERE id = ?', [id]);
      if (existingCheck.length === 0) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      if (!id) return res.status(400).json({ error: 'ID do pedido é obrigatório.' });

      const empresaFinal = empresa !== undefined ? empresa : null;
      const descricaoFinal = descricao !== undefined ? descricao : null;
      const dadosFinal = dados !== undefined ? JSON.stringify(dados) : JSON.stringify({});

      const [result] = await connection.execute(
        `UPDATE pedidos SET empresa = ?, descricao = ?, dados = ?, data_pedido = NOW() WHERE id = ?`,
        [empresaFinal, descricaoFinal, dadosFinal, id]
      );

      if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido não encontrado.' });
      return res.status(200).json({ success: true, message: 'Pedido atualizado com sucesso!' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID do pedido é obrigatório.' });
      await connection.execute('DELETE FROM pedidos WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Pedido removido com sucesso!' });
    }

    const [rows] = await connection.execute('SELECT * FROM pedidos ORDER BY data_pedido DESC');
    const pedidos = rows.map(row => ({
      ...row,
      dados: row.dados ? (typeof row.dados === 'string' ? JSON.parse(row.dados) : row.dados) : null
    }));
    return res.status(200).json(pedidos);
  } catch (err) {
    console.error('Erro na API de pedidos:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    try { if (connection) await connection.end(); } catch (e) {}
  }
};
