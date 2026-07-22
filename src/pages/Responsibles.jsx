import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit } from 'lucide-react';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Toast from '../components/Toast';

export default function Responsibles() {
  const [responsibles, setResponsibles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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

  function startEdit(resp) {
    setEditingId(resp.id);
    setName(resp.name);
    setDepartmentId(resp.department_id || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setDepartmentId('');
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim() || !departmentId) return;

    const wasEditing = !!editingId;
    const payload = { name, department_id: departmentId };

    const { error } = editingId
      ? await supabase.from('it_responsibles').update(payload).eq('id', editingId)
      : await supabase.from('it_responsibles').insert([payload]);

    if (!error) {
      setName('');
      setDepartmentId('');
      setEditingId(null);
      fetchData();
      setToastMessage(wasEditing ? 'Responsável atualizado com sucesso!' : 'Responsável adicionado com sucesso!');
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
    const { error } = await supabase.from('it_responsibles').delete().eq('id', id);
    if (!error) {
      fetchData();
      setToastMessage('Responsável excluído com sucesso!');
    } else setAlertMessage('Erro ao excluir: ' + error.message);
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
          <Select
            className="input"
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            required
          >
            <option value="">Selecione um Departamento...</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </Select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
          {editingId ? <><Edit size={18} /> Salvar</> : <><Plus size={18} /> Adicionar</>}
        </button>
        {editingId && (
          <button type="button" className="btn btn-outline" style={{ height: '40px' }} onClick={cancelEdit}>Cancelar</button>
        )}
      </form>

      {loading ? <p>Carregando responsáveis...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Departamento</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {responsibles.map(resp => (
                <tr key={resp.id}>
                  <td>{resp.name}</td>
                  <td>{resp.department?.name || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => startEdit(resp)}
                      className="btn btn-outline"
                      title="Editar"
                      style={{ padding: '6px', borderColor: 'transparent' }}
                    >
                      <Edit size={18} />
                    </button>
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

      <ConfirmModal
        open={!!deleteId}
        message="Deseja excluir este responsável?"
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
