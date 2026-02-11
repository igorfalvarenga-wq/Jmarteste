// Mock Data SDK - Simula operações de banco de dados local
window.dataSdk = {
  // Simula dados em localStorage
  storage: JSON.parse(localStorage.getItem('jmar_data') || '[]'),
  dataHandler: null,

  // Salva dados no localStorage
  save() {
    console.log('💾 Salvando dados...', this.storage);
    localStorage.setItem('jmar_data', JSON.stringify(this.storage));
    // Notifica as mudanças ao handler
    if (this.dataHandler && this.dataHandler.onDataChanged) {
      console.log('📢 Chamando onDataChanged com', this.storage.length, 'registros');
      this.dataHandler.onDataChanged(this.storage);
    } else {
      console.warn('⚠️ dataHandler não configurado ou não tem onDataChanged');
    }
  },

  // Carrega dados do localStorage
  load() {
    console.log('🔄 Carregando dados do localStorage...');
    this.storage = JSON.parse(localStorage.getItem('jmar_data') || '[]');
    console.log('✅ Dados carregados:', this.storage.length, 'registros');
  },

  // Inicializa o SDK com um handler para notificações
  async init(dataHandler) {
    try {
      this.dataHandler = dataHandler;
      console.log('✅ Data SDK inicializado');
      // Carrega dados do localStorage
      this.load();
      // Notifica o handler dos dados carregados
      this.save();
      return { isOk: true };
    } catch (error) {
      console.error('❌ Erro ao inicializar:', error);
      return { isOk: false, error: error.message };
    }
  },

  // Criar novo registro
  async create(data) {
    try {
      data.id = Date.now().toString();
      data.__backendId = data.id;
      this.storage.push(data);
      this.save();
      console.log('✅ Registro criado:', data);
      return { isOk: true, data: data };
    } catch (error) {
      console.error('❌ Erro ao criar:', error);
      return { isOk: false, error: error.message };
    }
  },

  // Ler todos os registros de um tipo
  async read(type) {
    try {
      const records = this.storage.filter(r => r.type === type);
      console.log(`📖 Registros de tipo '${type}':`, records);
      return { isOk: true, data: records };
    } catch (error) {
      console.error('❌ Erro ao ler:', error);
      return { isOk: false, error: error.message };
    }
  },

  // Atualizar registro
  async update(id, data) {
    try {
      const index = this.storage.findIndex(r => r.id === id || r.__backendId === id);
      if (index === -1) throw new Error('Registro não encontrado');
      this.storage[index] = { ...this.storage[index], ...data };
      this.save();
      console.log('✏️ Registro atualizado:', this.storage[index]);
      return { isOk: true, data: this.storage[index] };
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error);
      return { isOk: false, error: error.message };
    }
  },

  // Deletar registro
  async delete(id) {
    try {
      const index = this.storage.findIndex(r => r.id === id || r.__backendId === id);
      if (index === -1) throw new Error('Registro não encontrado');
      const deleted = this.storage.splice(index, 1);
      this.save();
      console.log('🗑️ Registro deletado:', deleted[0]);
      return { isOk: true };
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      return { isOk: false, error: error.message };
    }
  },

  // Limpar todos os dados
  async clear() {
    this.storage = [];
    this.save();
    console.log('🧹 Todos os dados foram limpos');
    return { isOk: true };
  }
};

console.log('✅ Data SDK carregado com sucesso!');
