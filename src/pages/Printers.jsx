import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function Printers() {
  const [printers, setPrinters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [model, setModel] = useState('');
  const [cartridgeType, setCartridgeType] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrinters();
    fetchDepartments();
  }, []);

  async function fetchPrinters() {
    setLoading(true);
    const { data, error } = await supabase
      .from('it_printers')
      .select('*, department:it_departments(name, unit)')
      .order('model');
    if (!error) setPrinters(data || []);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data } = await supabase.from('it_departments').select('*').order('name');
    setDepartments(data || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!model.trim()) return;

    const { error } = await supabase.from('it_printers').insert([{
      model,
      cartridge_type: cartridgeType || null,
      department_id: departmentId || null,
    }]);
    if (!error) {
      setModel('');
      setCartridgeType('');
      setDepartmentId('');
      fetchPrinters();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja excluir esta impressora?')) return;
    const { error } = await supabase.from('it_printers').delete().eq('id', id);
    if (!error) fetchPrinters();
    else alert('Erro ao excluir: ' + error.message);
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Gestão de Impressoras</h2>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          className="input"
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder="Modelo (ex: HP LaserJet M404dn)"
          style={{ flex: 1, minWidth: '220px', maxWidth: '320px' }}
        />
        <input
          className="input"
          value={cartridgeType}
          onChange={e => setCartridgeType(e.target.value)}
          placeholder="Tipo de Cartucho (ex: HP 58A)"
          style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }}
        />
        <select
          className="input"
          value={departmentId}
          onChange={e => setDepartmentId(e.target.value)}
          style={{ minWidth: '200px', maxWidth: '280px' }}
        >
          <option value="">Setor...</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.unit ? ` (${d.unit})` : ''}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">
          <Plus size={18} /> Adicionar
        </button>
      </form>

      {loading ? <p>Carregando impressoras...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Tipo de Cartucho</th>
                <th>Setor</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {printers.map(p => (
                <tr key={p.id}>
                  <td>{p.model}</td>
                  <td>{p.cartridge_type || '—'}</td>
                  <td>{p.department ? `${p.department.name}${p.department.unit ? ` (${p.department.unit})` : ''}` : '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-outline"
                      title="Excluir"
                      style={{ padding: '6px', color: 'var(--status-danger)', borderColor: 'transparent' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {printers.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nenhuma impressora cadastrada.
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
