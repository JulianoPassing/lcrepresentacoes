// ========== MENU HAMBÚRGUER MOBILE - LC REPRESENTAÇÕES (Padrão G8Sistema) ==========

document.addEventListener('DOMContentLoaded', function() {
  if (window.innerWidth <= 768) {
    initMobileMenu();
  }

  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
      initMobileMenu();
    } else {
      closeMobileMenu();
    }
  });
});

function initMobileMenu() {
  if (!document.querySelector('.mobile-menu-toggle')) {
    createMobileMenuElements();
  }
  setupMobileMenuEvents();
}

function createMobileMenuElements() {
  const header = document.querySelector('.header-top') || document.querySelector('header');
  if (!header) return;

  const menuToggle = document.createElement('button');
  menuToggle.className = 'mobile-menu-toggle';
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  menuToggle.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(menuToggle);

  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'mobile-menu';

  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';

  const userInfo = document.querySelector('#user-info');
  const logoutButton = document.querySelector('#logout-button');
  const voltarButton = document.querySelector('.btn-back');

  let menuItems = '';

  if (userInfo) {
    const userName = userInfo.textContent.trim();
    menuItems += `<div class="mobile-menu-item user-info"><span class="icon">👤</span><span>${userName}</span></div>`;
  }

  if (voltarButton) {
    const href = voltarButton.getAttribute('href') || 'painel.html';
    const text = voltarButton.textContent.trim() || 'Voltar';
    menuItems += `<a href="${href}" class="mobile-menu-item voltar"><span class="icon">🔙</span><span>${text}</span></a>`;
  }

  const path = (window.location.pathname || window.location.href || '');

  if (path.includes('painel.html') && !path.includes('painel-clientes')) {
    menuItems += `
      <a href="painel-clientes.html" class="mobile-menu-item"><span class="icon">👥</span><span>Clientes</span></a>
      <a href="pedidos.html" class="mobile-menu-item"><span class="icon">📋</span><span>Pedidos</span></a>
      <a href="vertice.html" class="mobile-menu-item"><span class="icon">🛵</span><span>Pedidos Vértice</span></a>
    `;
  }

  if (path.includes('painel-clientes')) {
    menuItems += `
      <a href="painel.html" class="mobile-menu-item"><span class="icon">🏠</span><span>Painel Principal</span></a>
      <a href="pedidos.html" class="mobile-menu-item"><span class="icon">📋</span><span>Pedidos</span></a>
      <a href="vertice.html" class="mobile-menu-item"><span class="icon">🛵</span><span>Pedidos Vértice</span></a>
    `;
  }

  if (path.includes('pedidos.html')) {
    menuItems += `
      <a href="painel.html" class="mobile-menu-item"><span class="icon">🏠</span><span>Painel Principal</span></a>
      <a href="painel-clientes.html" class="mobile-menu-item"><span class="icon">👥</span><span>Clientes</span></a>
      <a href="vertice.html" class="mobile-menu-item"><span class="icon">🛵</span><span>Novo Pedido Vértice</span></a>
    `;
  }

  if (path.includes('vertice')) {
    menuItems += `
      <a href="painel.html" class="mobile-menu-item"><span class="icon">🏠</span><span>Painel Principal</span></a>
      <a href="painel-clientes.html" class="mobile-menu-item"><span class="icon">👥</span><span>Clientes</span></a>
      <a href="pedidos.html" class="mobile-menu-item"><span class="icon">📋</span><span>Pedidos</span></a>
    `;
  }

  menuItems += `<a href="index.html" class="mobile-menu-item logout" onclick="sessionStorage.removeItem('loggedInUser');"><span class="icon">🚪</span><span>Sair</span></a>`;
  mobileMenu.innerHTML = menuItems;

  document.body.appendChild(overlay);
  document.body.appendChild(mobileMenu);
}

function setupMobileMenuEvents() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');

  if (!menuToggle || !mobileMenu || !overlay) return;

  menuToggle.addEventListener('click', function() {
    if (mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  overlay.addEventListener('click', closeMobileMenu);

  document.querySelectorAll('.mobile-menu-item').forEach(item => {
    if (!item.classList.contains('user-info')) {
      item.addEventListener('click', function() {
        if (!item.classList.contains('logout')) setTimeout(closeMobileMenu, 100);
      });
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });
}

function openMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  if (menuToggle && mobileMenu && overlay) {
    menuToggle.classList.add('active');
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  if (menuToggle && mobileMenu && overlay) {
    menuToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

window.MobileMenu = { open: openMobileMenu, close: closeMobileMenu };
