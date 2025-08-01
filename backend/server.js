const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializar banco de dados SQLite
const db = new sqlite3.Database('./tasks.db');

// Criar tabela de tarefas se não existir
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Rotas da API

// GET - Listar todas as tarefas
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET - Buscar tarefa por ID
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(row);
  });
});

// POST - Criar nova tarefa
app.post('/api/tasks', (req, res) => {
  const { title, description, due_date } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, due_date, status) 
    VALUES (?, ?, ?, 'pending')
  `);
  
  stmt.run([title.trim(), description || null, due_date || null], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Retornar a tarefa criada
    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(row);
    });
  });
  
  stmt.finalize();
});

// PUT - Atualizar tarefa
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, status } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  const stmt = db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, due_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run([
    title.trim(), 
    description || null, 
    due_date || null, 
    status || 'pending', 
    id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    // Retornar a tarefa atualizada
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    });
  });
  
  stmt.finalize();
});

// DELETE - Remover tarefa
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run([id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json({ message: 'Tarefa removida com sucesso' });
  });
  
  stmt.finalize();
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}/api/tasks`);
});

// Fechar conexão com o banco ao encerrar o processo
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Conexão com o banco de dados fechada.');
    process.exit(0);
  });
});