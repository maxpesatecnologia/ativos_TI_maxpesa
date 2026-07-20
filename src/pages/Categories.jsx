import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase.from('it_categories').select('*').order('name');
    if (!error) setCategories(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    
    const { error } = await supabase.from('it_categories').insert([{ name }]);
    if (!error) {
      setName('');
      fetchCategories();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja excluir esta categoria? Ela pode estar atrelada a ativos existentes.')) return;
    const { error } = await supabase.from('it_categories').delete().eq('id', id);
    if (!error) fetchCategories();
    else alert('Erro ao excluir: ' + error.message);
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Gestão de Categorias</h2>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input 
          className="input" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Nome da categoria (ex: Notebook, Monitor)..." 
          style={{ flex: 1, maxWidth: '400px' }}
        />
        <button type="submit" className="btn btn-primary">
          <Plus size={18} /> Adicionar
        </button>
      </form>

      {loading ? <p>Carregando categorias...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(cat.id)} 
                      className="btn btn-outline" 
                      title="Excluir"
                      style={{ padding: '6px', color: 'var(--status-danger)', borderColor: 'transparent' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
