// Server SDK - Gerencia conexão com servidor Node.js
// Modo Servidor: Não usa localStorage, salva tudo no backend

console.log('🚀 Carregando server_sdk.js...');

window.serverSdk = {
  // 🔴 CONFIGURAÇÃO: Se você hospedou o backend (Glitch/Render), cole o link aqui:
  REMOTE_URL: 'https://jmarteste.onrender.com', // Cole aqui o link do Render (ex: 'https://jmar-api.onrender.com')

  SERVER_URL: 'http://localhost:3000', // Valor padrão
  isConnected: false,
  storage: [],

  // Verificar se servidor está online
  async checkConnection() {
    // Lista de URLs para tentar (Auto-Discovery)
    const candidates = new Set();
    
    // 0. Se tiver URL remota configurada, tenta ela primeiro
    if (this.REMOTE_URL) candidates.add(this.REMOTE_URL);

    // 1. Se já estiver na porta 3000, usa a origem atual
    if (window.location.port === '3000') candidates.add(window.location.origin);
    
    // 2. Tenta construir URL baseada no hostname atual
    const protocol = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
    const host = window.location.hostname || 'localhost';
    candidates.add(`${protocol}//${host}:3000`);
    
    // 3. Fallbacks garantidos (localhost e IP local)
    candidates.add('http://localhost:3000');
    candidates.add('http://127.0.0.1:3000');

    console.log('🔌 Tentando conectar em:', [...candidates]);

    for (const url of candidates) {
      try {
        const response = await fetch(`${url}/api/health`);
        if (response.ok) {
          this.SERVER_URL = url;
          this.isConnected = true;
          console.log('✅ Conectado com sucesso em:', this.SERVER_URL);
          if (window.showToast) window.showToast(`Conectado ao servidor: ${url.includes('render') ? 'Nuvem ☁️ (Global)' : 'Local 🏠 (Dev)'}`);
          return true;
        }
      } catch (e) { /* Tenta a próxima */ }
    }

    this.isConnected = false;
    console.error('❌ Falha ao conectar. Verifique se rodou "node server.js"');
    
    // Alerta visual para facilitar o diagnóstico
    const msg = '❌ Servidor desconectado! Abra o terminal e rode: node server.js';
    if (window.showToast) window.showToast(msg, 'error');
    else alert(msg);
    
    return false;
  },

  // Registrar novo usuário
  async register(username, password) {
    if (!this.isConnected) return { isOk: false, error: 'Servidor desconectado. Inicie o server.js' };

    try {
      const response = await fetch(`${this.SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (err) {
      console.error('Erro ao registrar:', err);
      return { isOk: false, error: 'Erro de conexão' };
    }
  },

  // Fazer login
  async login(username, password) {
    if (!this.isConnected) return { isOk: false, error: 'Servidor desconectado' };

    try {
      const response = await fetch(`${this.SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      return { isOk: false, error: 'Erro ao conectar' };
    }
  },

  // Obter todos os dados
  async load() {
    if (!this.isConnected) return { isOk: false, error: 'Servidor desconectado' };

    try {
      const response = await fetch(`${this.SERVER_URL}/api/data`);
      const result = await response.json();
      if (result.isOk) {
        this.storage = result.data;
        console.log('✅ Dados carregados do servidor:', this.storage.length);
        return { isOk: true, data: this.storage };
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      return { isOk: false, error: 'Erro ao carregar dados' };
    }
    return { isOk: false };
  },

  // Criar novo registro
  async create(record) {
    if (!this.isConnected) return { isOk: false, error: 'Servidor desconectado' };

    try {
      const response = await fetch(`${this.SERVER_URL}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const result = await response.json();
      if (result.isOk) {
        // Atualiza memória local
        const newRecord = { ...record, id: result.id, __backendId: result.id };
        this.storage.push(newRecord);
        return { isOk: true, id: result.id };
      }
    } catch (err) {
      console.error('Erro ao criar registro:', err);
    }
    return { isOk: false, error: 'Erro ao salvar no servidor' };
  },

  // Atualizar registro
  async update(record) {
    if (!this.isConnected) return { isOk: false, error: 'Servidor desconectado' };

    try {
      const response = await fetch(`${this.SERVER_URL}/api/data/${record.__backendId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const result = await response.json();
      if (result.isOk) {
        const index = this.storage.findIndex(r => r.__backendId === record.__backendId);
        if (index >= 0) this.storage[index] = record;
        return { isOk: true };
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    }
    return { isOk: false, error: 'Erro ao atualizar no servidor' };
  },

  // Deletar registro
  async delete(idOrRecord) {
    if (!this.isConnected) return { isOk: false, error: 'Servidor desconectado' };
    
    const id = idOrRecord.__backendId || idOrRecord.id || idOrRecord;
    
    try {
      const response = await fetch(`${this.SERVER_URL}/api/data/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.isOk) {
        this.storage = this.storage.filter(r => r.__backendId !== id && r.id !== id);
        return { isOk: true };
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
    return { isOk: false, error: 'Erro ao deletar no servidor' };
  },

  // Init - conectar e carregar dados
  async init(handler) {
    console.log('🔧 Iniciando Server SDK (Modo Servidor Puro)...');
    await this.checkConnection();
    const result = await this.load();
    if (handler && handler.onDataChanged) {
      handler.onDataChanged(this.storage);
    }
    return result;
  }
};

console.log('📦 Server SDK carregado (Sem localStorage)');
