import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    const { data, error } = await supabase.from('it_departments').select('*').order('name');
    if (!error) setDepartments(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    
    const { error } = await supabase.from('it_departments').insert([{ name, unit }]);
    if (!error) {
      setName('');
      setUnit('');
      fetchDepartments();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja excluir este departamento?')) return;
    const { error } = await supabase.from('it_departments').delete().eq('id', id);
    if (!error) fetchDepartments();
    else alert('Erro ao excluir: ' + error.message);
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Gestão de Departamentos</h2>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}>
          <input 
            className="input" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nome do Departamento" 
            required
          />
        </div>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}>
          <input 
            className="input" 
            value={unit} 
            onChange={e => setUnit(e.target.value)} 
            placeholder="Unidade (Filial/Sede)" 
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
          <Plus size={18} /> Adicionar
        </button>
      </form>

      {loading ? <p>Carregando departamentos...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Unidade</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dep => (
                <tr key={dep.id}>
                  <td>{dep.name}</td>
                  <td>{dep.unit || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(dep.id)} 
                      className="btn btn-outline" 
                      title="Excluir"
                      style={{ padding: '6px', color: 'var(--status-danger)', borderColor: 'transparent' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nenhum departamento cadastrado.
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
