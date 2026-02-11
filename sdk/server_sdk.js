// Server SDK - Gerencia conexão com servidor Node.js
// Faz fallback para localStorage se servidor não estiver disponível

window.serverSdk = {
  SERVER_URL: 'http://10.30.10.140:3000',
  isConnected: false,
  storage: [],

  // Verificar se servidor está online
  async checkConnection() {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/health`);
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Conectado ao servidor JMAR');
        return true;
      }
    } catch (err) {
      this.isConnected = false;
      console.warn('⚠️ Servidor JMAR não disponível, usando localStorage');
      return false;
    }
  },

  // Registrar novo usuário
  async register(username, password) {
    if (!this.isConnected) {
      console.log('📥 Usando fallback local para registro');
      localStorage.setItem(`user_${username}`, password);
      return { isOk: true, message: 'Cadastrado localmente' };
    }

    try {
      const response = await fetch(`${this.SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Erro ao registrar:', err);
      // Fallback
      localStorage.setItem(`user_${username}`, password);
      return { isOk: true, message: 'Cadastrado localmente (fallback)' };
    }
  },

  // Fazer login
  async login(username, password) {
    if (!this.isConnected) {
      console.log('📥 Usando fallback local para login');
      const savedPassword = localStorage.getItem(`user_${username}`);
      if (savedPassword === password) {
        return { isOk: true, message: 'Login local' };
      }
      return { isOk: false, error: 'Usuário ou senha incorretos (local)' };
    }

    try {
      const response = await fetch(`${this.SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      // Fallback
      const savedPassword = localStorage.getItem(`user_${username}`);
      if (savedPassword === password) {
        return { isOk: true, message: 'Login local (fallback)' };
      }
      return { isOk: false, error: 'Erro ao conectar' };
    }
  },

  // Obter todos os dados
  async load() {
    if (!this.isConnected) {
      console.log('📥 Carregando dados do localStorage');
      const jmarData = localStorage.getItem('jmar_data');
      this.storage = jmarData ? JSON.parse(jmarData) : [];
      return { isOk: true, data: this.storage };
    }

    try {
      const response = await fetch(`${this.SERVER_URL}/api/data`);
      const result = await response.json();
      if (result.isOk) {
        this.storage = result.data;
        // Salvar no localStorage também para backup
        localStorage.setItem('jmar_data', JSON.stringify(this.storage));
        console.log('✅ Dados sincronizados do servidor');
        return { isOk: true, data: this.storage };
      }
    } catch (err) {
      console.warn('Erro ao carregar do servidor, usando localStorage:', err);
      const jmarData = localStorage.getItem('jmar_data');
      this.storage = jmarData ? JSON.parse(jmarData) : [];
      return { isOk: true, data: this.storage };
    }
  },

  // Criar novo registro
  async create(record) {
    // Sempre salva no localStorage primeiro
    const newRecord = {
      ...record,
      __backendId: Date.now() + Math.random(),
      id: Date.now() + Math.random()
    };
    this.storage.push(newRecord);
    localStorage.setItem('jmar_data', JSON.stringify(this.storage));

    // Tentar salvar no servidor
    if (this.isConnected) {
      try {
        const response = await fetch(`${this.SERVER_URL}/api/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        const result = await response.json();
        if (result.isOk) {
          newRecord.__backendId = result.id;
          localStorage.setItem('jmar_data', JSON.stringify(this.storage));
          console.log('✅ Registro salvo no servidor');
        }
      } catch (err) {
        console.warn('⚠️ Registro salvo localmente, falha ao salvar no servidor:', err);
      }
    } else {
      console.log('📥 Registro salvo apenas localmente');
    }

    return { isOk: true, id: newRecord.__backendId };
  },

  // Atualizar registro
  async update(record) {
    // Sempre atualiza no localStorage primeiro
    const index = this.storage.findIndex(r => r.__backendId === record.__backendId);
    if (index >= 0) {
      this.storage[index] = record;
      localStorage.setItem('jmar_data', JSON.stringify(this.storage));
    }

    // Tentar atualizar no servidor
    if (this.isConnected && record.__backendId) {
      try {
        const response = await fetch(`${this.SERVER_URL}/api/data/${record.__backendId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        const result = await response.json();
        if (result.isOk) {
          console.log('✅ Registro atualizado no servidor');
        }
      } catch (err) {
        console.warn('⚠️ Registro atualizado localmente, falha ao atualizar no servidor:', err);
      }
    } else {
      console.log('📥 Registro atualizado apenas localmente');
    }

    return { isOk: true };
  },

  // Deletar registro
  async delete(idOrRecord) {
    const id = idOrRecord.__backendId || idOrRecord.id || idOrRecord;
    
    // Sempre deleta do localStorage primeiro
    this.storage = this.storage.filter(r => r.__backendId !== id && r.id !== id);
    localStorage.setItem('jmar_data', JSON.stringify(this.storage));

    // Tentar deletar no servidor
    if (this.isConnected && id) {
      try {
        const response = await fetch(`${this.SERVER_URL}/api/data/${id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.isOk) {
          console.log('✅ Registro deletado no servidor');
        }
      } catch (err) {
        console.warn('⚠️ Registro deletado localmente, falha ao deletar do servidor:', err);
      }
    } else {
      console.log('📥 Registro deletado apenas localmente');
    }

    return { isOk: true };
  },

  // Init - conectar e carregar dados
  async init(handler) {
    console.log('🔧 Iniciando Server SDK...');
    
    // Verificar conexão
    await this.checkConnection();
    
    // Carregar dados
    const result = await this.load();
    
    if (handler && handler.onDataChanged) {
      handler.onDataChanged(this.storage);
    }

    return result;
  }
};

console.log('📦 Server SDK carregado');
