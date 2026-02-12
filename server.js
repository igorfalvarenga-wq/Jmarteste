const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
// Usa a porta definida pelo serviço de hospedagem ou 3000 se for local
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'jmar.db');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(__dirname));

// Log de requisições para debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Inicializar banco SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err);
  } else {
    console.log('✅ Conectado ao SQLite em:', DB_PATH);
    createTables();
  }
});

// Criar tabelas
function createTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        client_id TEXT,
        client_name TEXT,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_data LONGBLOB NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(data_id) REFERENCES data(id)
      )
    `);

    console.log('📊 Tabelas criadas/verificadas com sucesso!');
  });
}

// ===== ROTAS DE AUTENTICAÇÃO =====

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.json({ isOk: false, error: 'Usuário e senha obrigatórios' });
  }

  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password],
    (err) => {
      if (err) {
        return res.json({ isOk: false, error: 'Usuário já existe' });
      }
      res.json({ isOk: true, message: 'Cadastro realizado com sucesso!' });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      if (err) {
        return res.json({ isOk: false, error: 'Erro no banco' });
      }
      if (row) {
        res.json({ isOk: true, message: 'Login realizado!' });
      } else {
        res.json({ isOk: false, error: 'Usuário ou senha incorretos' });
      }
    }
  );
});

// ===== ROTAS DE DADOS =====

// Obter todos os dados
app.get('/api/data', (req, res) => {
  db.all('SELECT * FROM data ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.json({ isOk: false, error: err.message });
    }
    
    const data = rows.map(row => ({
      __backendId: row.id,
      id: row.id,
      type: row.type,
      client_id: row.client_id,
      client_name: row.client_name,
      ...JSON.parse(row.data),
      created_at: row.created_at
    }));
    
    res.json({ isOk: true, data });
  });
});

// Criar novo registro
app.post('/api/data', (req, res) => {
  const { type, client_id, client_name, ...dataObj } = req.body;
  const dataJson = JSON.stringify(dataObj);
  
  db.run(
    'INSERT INTO data (type, client_id, client_name, data) VALUES (?, ?, ?, ?)',
    [type, client_id, client_name, dataJson],
    function(err) {
      if (err) {
        return res.json({ isOk: false, error: err.message });
      }
      res.json({ isOk: true, id: this.lastID });
    }
  );
});

// Atualizar registro
app.put('/api/data/:id', (req, res) => {
  const { id } = req.params;
  const { type, client_id, client_name, ...dataObj } = req.body;
  const dataJson = JSON.stringify(dataObj);
  
  db.run(
    'UPDATE data SET type = ?, client_id = ?, client_name = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [type, client_id, client_name, dataJson, id],
    (err) => {
      if (err) {
        return res.json({ isOk: false, error: err.message });
      }
      res.json({ isOk: true });
    }
  );
});

// Deletar registro
app.delete('/api/data/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM data WHERE id = ?', [id], (err) => {
    if (err) {
      return res.json({ isOk: false, error: err.message });
    }
    res.json({ isOk: true });
  });
});

// ===== ROTAS DE ARQUIVOS =====

// Salvar arquivo (base64)
app.post('/api/file', (req, res) => {
  const { data_id, filename, file_data } = req.body;
  
  db.run(
    'INSERT INTO files (data_id, filename, file_data) VALUES (?, ?, ?)',
    [data_id, filename, file_data],
    function(err) {
      if (err) {
        return res.json({ isOk: false, error: err.message });
      }
      res.json({ isOk: true, file_id: this.lastID });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ isOk: true, message: 'Servidor JMAR rodando!', timestamp: new Date() });
});

// Servir arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor JMAR rodando em: http://10.30.10.140:${PORT}`);
  console.log(`📊 Banco de dados: ${DB_PATH}`);
  console.log(`✅ Pronto para aceitar conexões!`);
});
