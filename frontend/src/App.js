import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, Clock, CheckCircle, Circle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/tasks';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Carregar tarefas
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTasks(data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Título é obrigatório!');
      return;
    }

    try {
      const url = editingTask ? `${API_URL}/${editingTask.id}` : API_URL;
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const task = await response.json();
        
        if (editingTask) {
          setTasks(tasks.map(t => t.id === task.id ? task : t));
        } else {
          setTasks([task, ...tasks]);
        }
        
        closeModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar tarefa');
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== id));
      } else {
        alert('Erro ao excluir tarefa');
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      alert('Erro ao excluir tarefa');
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    
    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const openModal = (task = null) => {
    setEditingTask(task);
    setFormData({
      title: task ? task.title : '',
      description: task ? task.description || '' : '',
      due_date: task ? task.due_date || '' : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', due_date: '' });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status === 'pending';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando tarefas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📝 My To-Do List
          </h1>
          <p className="text-gray-600">Organize suas tarefas de forma eficiente</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-gray-600">Concluídas</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-gray-600">Pendentes</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Concluídas
            </button>
          </div>
          
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nova Tarefa
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl text-gray-600 mb-2">Nenhuma tarefa encontrada</div>
              <div className="text-gray-500">
                {filter === 'all' 
                  ? 'Que tal criar sua primeira tarefa?' 
                  : `Nenhuma tarefa ${filter === 'pending' ? 'pendente' : 'concluída'} encontrada`
                }
              </div>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                  task.status === 'completed' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className={`mt-1 transition-colors ${
                        task.status === 'completed' 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-gray-400 hover:text-blue-600'
                      }`}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle size={24} />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${
                        task.status === 'completed' 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-800'
                      }`}>
                        {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className={`text-gray-600 mt-1 ${
                          task.status === 'completed' ? 'line-through' : ''
                        }`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(task.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        
                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${
                            isOverdue(task.due_date) && task.status === 'pending' 
                              ? 'text-red-600 font-medium' 
                              : ''
                          }`}>
                            <Calendar size={14} />
                            {formatDate(task.due_date)}
                            {isOverdue(task.due_date) && task.status === 'pending' && (
                              <span className="text-red-600 ml-1">• Atrasada</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(task)}
                      className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o título da tarefa"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Adicione uma descrição (opcional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {editingTask ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoApp;