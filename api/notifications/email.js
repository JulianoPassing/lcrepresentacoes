const nodemailer = require('nodemailer');

/**
 * Notificação por E-mail - LC Representações
 * Configure: EMAIL_USER, EMAIL_PASS, EMAIL_TO
 */

class EmailNotification {
  constructor() {
    this.transporter = null;
    this.configured = false;
    this.init();
  }

  init() {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      if (!emailUser || !emailPass) {
        console.warn('⚠️ E-mail não configurado. Configure EMAIL_USER e EMAIL_PASS.');
        return;
      }
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass }
      });
      this.configured = true;
      console.log('✅ E-mail LC Representações configurado');
    } catch (error) {
      console.error('❌ Erro ao configurar e-mail:', error.message);
    }
  }

  isConfigured() { return this.configured; }

  async notifyNewOrder(pedidoData) {
    if (!this.isConfigured()) return { success: false, message: 'E-mail não configurado' };
    try {
      const emailTo = process.env.EMAIL_TO || 'lcrepresentacoeslidiane@gmail.com';
      const { id, empresa, descricao, dados, origem } = pedidoData;
      let dadosParsed = {};
      if (typeof dados === 'string') {
        try { dadosParsed = JSON.parse(dados); } catch (e) { dadosParsed = {}; }
      } else if (dados) dadosParsed = dados;

      const isB2B = origem === 'b2b' || dadosParsed.origem === 'b2b';
      const clienteNome = dadosParsed.clienteNome || 'Cliente não identificado';
      const observacoes = dadosParsed.observacoes || 'Sem observações';

      const subject = isB2B ? `🛒 Novo Pedido B2B #${id} - ${empresa}` : `🛒 Novo Pedido #${id} - ${empresa}`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#2F2F2F;background:#f5f5f5;padding:20px}
.email-container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.12)}
.header{background:linear-gradient(135deg,#0065B3 0%,#4CAB3F 100%);color:#fff;padding:40px 30px;text-align:center}
.header h1{font-size:22px;font-weight:600;margin:15px 0 5px 0}
.divider{height:4px;background:linear-gradient(90deg,#0065B3 0%,#4CAB3F 100%)}
.content{padding:35px 30px}
.alert-box{background:linear-gradient(135deg,#e8f4fd 0%,#fff 100%);border-left:5px solid #0065B3;padding:20px;border-radius:8px;margin-bottom:30px}
.info-box{background:#fafafa;padding:25px;border-radius:10px;margin-bottom:25px;border:1px solid #e0e0e0}
.info-row{display:flex;padding:12px 0;border-bottom:1px solid #e5e5e5}
.info-row:last-child{border-bottom:none}
.info-label{font-weight:700;color:#2F2F2F;min-width:140px}
.info-label::before{content:'●';color:#4CAB3F;margin-right:8px}
.info-value{color:#333;flex:1}
.badge{display:inline-block;padding:6px 14px;border-radius:20px;background:linear-gradient(135deg,#0065B3,#4CAB3F);color:#fff;font-size:11px;font-weight:700}
.section-title{font-size:16px;font-weight:700;color:#2F2F2F;margin-bottom:15px;padding-bottom:10px;border-bottom:3px solid #0065B3}
.description-box{background:#fafafa;padding:20px;border-radius:8px;border:1px solid #e0e0e0;white-space:pre-wrap;font-family:monospace;font-size:13px}
.footer{background:linear-gradient(135deg,#2F2F2F 0%,#505050 100%);color:#fff;padding:25px 30px;text-align:center}
.footer-logo{font-size:20px;font-weight:800;color:#4CAB3F;margin-bottom:10px}
</style></head>
<body>
<div class="email-container">
<div class="header"><h1>🛒 Novo Pedido Recebido</h1><p>LC REPRESENTAÇÕES</p></div>
<div class="divider"></div>
<div class="content">
<div class="alert-box"><div style="font-size:32px;margin-bottom:10px">🔔</div><div style="font-size:18px;font-weight:700;color:#0065B3">Atenção: Novo Pedido Cadastrado!</div><div style="color:#333">Um novo pedido foi registrado no sistema.</div></div>
<div class="info-box">
<div class="info-row"><div class="info-label">Pedido</div><div class="info-value"><strong>#${id}</strong></div></div>
<div class="info-row"><div class="info-label">Empresa</div><div class="info-value"><strong>${empresa}</strong></div></div>
${isB2B ? `<div class="info-row"><div class="info-label">Tipo</div><div class="info-value"><span class="badge">Portal B2B</span></div></div>
<div class="info-row"><div class="info-label">Cliente</div><div class="info-value">${clienteNome}</div></div>
${observacoes !== 'Sem observações' ? `<div class="info-row"><div class="info-label">Observações</div><div class="info-value">${observacoes}</div></div>` : ''}` : ''}
<div class="info-row"><div class="info-label">Data/Hora</div><div class="info-value">${new Date().toLocaleString('pt-BR',{dateStyle:'long',timeStyle:'short'})}</div></div>
</div>
<div class="section-title">Descrição do Pedido</div>
<div class="description-box">${descricao || 'Nenhuma descrição fornecida.'}</div>
</div>
<div class="footer"><div class="footer-logo">LC REPRESENTAÇÕES</div><p>Este é um e-mail automático do Sistema LC</p></div>
</div>
</body>
</html>`;

      const textContent = `🛒 NOVO PEDIDO #${id}\nEmpresa: ${empresa}\n${isB2B ? `Cliente: ${clienteNome}\n` : ''}\n${descricao || 'Sem descrição'}\n\n---\nSistema LC Representações`;

      const mailOptions = {
        from: `"LC Representações" <${process.env.EMAIL_USER}>`,
        to: emailTo,
        subject,
        text: textContent,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ E-mail enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailNotification();
