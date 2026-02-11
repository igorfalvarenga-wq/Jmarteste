// Mock Element SDK - Simula operações de DOM
window.elementSdk = {
  querySelector(selector) {
    return document.querySelector(selector);
  },

  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  },

  getElementById(id) {
    return document.getElementById(id);
  },

  show(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.classList.remove('hidden');
  },

  hide(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.classList.add('hidden');
  },

  setText(element, text) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.textContent = text;
  }
};

console.log('✅ Element SDK carregado com sucesso!');
