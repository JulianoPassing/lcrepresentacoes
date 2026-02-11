// ========== SISTEMA DE AUTENTICAÇÃO LC REPRESENTAÇÕES ==========

class AuthSystem {
  constructor() {
    this.apiUrl = '/api/auth';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async login(username, password) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return { success: false, message: 'Erro de conexão. Tente novamente.' };
    }
  }

  loginFallback(username, password) {
    const validUsers = { lidiane: "123456" };
    if (validUsers[username] && validUsers[username] === password) {
      return { success: true, user: username };
    }
    return { success: false, message: 'Usuário ou senha inválidos' };
  }

  async authenticate(username, password) {
    try {
      const apiResult = await this.login(username, password);
      if (apiResult.success) return apiResult;
    } catch (error) {
      console.log('API indisponível, usando fallback local');
    }
    return this.loginFallback(username, password);
  }

  showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.style.display = 'block';
    element.className = type === 'success' ? 'success-message' : 'error-message';
  }

  setLoading(button, loading) {
    const spinner = button.querySelector('.spinner');
    const icon = button.querySelector('i:not(.spinner)');
    const text = button.querySelector('span:last-child');
    if (loading) {
      button.disabled = true;
      button.style.cursor = 'wait';
      if (spinner) spinner.style.display = 'inline-block';
      if (icon) icon.style.display = 'none';
      if (text) text.textContent = 'Verificando...';
    } else {
      button.disabled = false;
      button.style.cursor = 'pointer';
      if (spinner) spinner.style.display = 'none';
      if (icon) icon.style.display = 'inline-block';
      if (text) text.textContent = 'Entrar';
    }
  }
}

window.AuthSystem = AuthSystem;
