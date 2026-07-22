import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Toast from '../components/Toast';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    const { data, error } = await supabase.from('it_departments').select('*').order('name');
    if (!error) setDepartments(data || []);
    setLoading(false);
  }

  function startEdit(dep) {
    setEditingId(dep.id);
    setName(dep.name);
    setUnit(dep.unit || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setUnit('');
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const wasEditing = !!editingId;
    const { error } = editingId
      ? await supabase.from('it_departments').update({ name, unit }).eq('id', editingId)
      : await supabase.from('it_departments').insert([{ name, unit }]);

    if (!error) {
      setName('');
      setUnit('');
      setEditingId(null);
      fetchDepartments();
      setToastMessage(wasEditing ? 'Departamento atualizado com sucesso!' : 'Departamento adicionado com sucesso!');
    } else {
      setAlertMessage('Erro ao salvar: ' + error.message);
    }
  }

  function handleDelete(id) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    const id = deleteId;
    setDeleteId(null);
    const { error } = await supabase.from('it_departments').delete().eq('id', id);
    if (!error) {
      fetchDepartments();
      setToastMessage('Departamento excluído com sucesso!');
    } else setAlertMessage('Erro ao excluir: ' + error.message);
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
          {editingId ? <><Edit size={18} /> Salvar</> : <><Plus size={18} /> Adicionar</>}
        </button>
        {editingId && (
          <button type="button" className="btn btn-outline" style={{ height: '40px' }} onClick={cancelEdit}>Cancelar</button>
        )}
      </form>

      {loading ? <p>Carregando departamentos...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Unidade</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dep => (
                <tr key={dep.id}>
                  <td>{dep.name}</td>
                  <td>{dep.unit || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => startEdit(dep)}
                      className="btn btn-outline"
                      title="Editar"
                      style={{ padding: '6px', borderColor: 'transparent' }}
                    >
                      <Edit size={18} />
                    </button>
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

      <ConfirmModal
        open={!!deleteId}
        message="Deseja excluir este departamento?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
      <AlertModal
        open={!!alertMessage}
        title="Erro"
        message={alertMessage}
        onClose={() => setAlertMessage('')}
      />
      <Toast
        open={!!toastMessage}
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
