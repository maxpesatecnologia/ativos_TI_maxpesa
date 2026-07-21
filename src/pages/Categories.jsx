import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';
import Select from '../components/Select';

const TIPOS = ['Hardware', 'Licença', 'Celular'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [tipo, setTipo] = useState('Hardware');
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

    try {
      const { error } = await supabase.from('it_categories').insert([{ name, tipo }]);
      if (!error) {
        setName('');
        setTipo('Hardware');
        fetchCategories();
      } else {
        alert('Erro ao salvar: ' + error.message);
      }
    } catch (err) {
      console.error('Falha inesperada ao adicionar categoria:', err);
      alert('Falha inesperada ao adicionar categoria: ' + err.message);
    }
  }

  async function handleTipoChange(id, novoTipo) {
    const { error } = await supabase.from('it_categories').update({ tipo: novoTipo }).eq('id', id);
    if (!error) fetchCategories();
    else alert('Erro ao atualizar tipo: ' + error.message);
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
        <Select className="input" value={tipo} onChange={e => setTipo(e.target.value)} style={{ maxWidth: '200px' }}>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
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
                <th style={{ width: '180px' }}>Tipo</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>
                    <Select
                      className="input"
                      value={cat.tipo || 'Hardware'}
                      onChange={e => handleTipoChange(cat.id, e.target.value)}
                      triggerStyle={{ padding: '6px 10px' }}
                    >
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </td>
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
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
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
