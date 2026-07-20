import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function Responsibles() {
  const [responsibles, setResponsibles] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch departments for the select dropdown
    const { data: deps } = await supabase.from('it_departments').select('*').order('name');
    setDepartments(deps || []);

    // Fetch responsibles with their department info
    const { data: resp, error } = await supabase
      .from('it_responsibles')
      .select(`*, department:it_departments(name)`)
      .order('name');
      
    if (!error) setResponsibles(resp || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim() || !departmentId) return;
    
    const { error } = await supabase.from('it_responsibles').insert([{ 
      name, 
      department_id: departmentId 
    }]);
    
    if (!error) {
      setName('');
      setDepartmentId('');
      fetchData();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja excluir este responsável?')) return;
    const { error } = await supabase.from('it_responsibles').delete().eq('id', id);
    if (!error) fetchData();
    else alert('Erro ao excluir: ' + error.message);
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Gestão de Responsáveis</h2>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}>
          <input 
            className="input" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nome Completo" 
            required
          />
        </div>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}>
          <select 
            className="input" 
            value={departmentId} 
            onChange={e => setDepartmentId(e.target.value)} 
            required
          >
            <option value="">Selecione um Departamento...</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
          <Plus size={18} /> Adicionar
        </button>
      </form>

      {loading ? <p>Carregando responsáveis...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Departamento</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {responsibles.map(resp => (
                <tr key={resp.id}>
                  <td>{resp.name}</td>
                  <td>{resp.department?.name || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(resp.id)} 
                      className="btn btn-outline" 
                      title="Excluir"
                      style={{ padding: '6px', color: 'var(--status-danger)', borderColor: 'transparent' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {responsibles.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nenhum responsável cadastrado.
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
