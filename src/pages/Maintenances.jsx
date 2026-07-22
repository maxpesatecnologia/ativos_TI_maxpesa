import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Wrench } from 'lucide-react';
import Select from '../components/Select';
import AlertModal from '../components/AlertModal';
import Toast from '../components/Toast';

export default function Maintenances() {
  const [maintenances, setMaintenances] = useState([]);
  const [assets, setAssets] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [form, setForm] = useState({
    asset_id: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    maintenance_type: 'Corretiva',
    problem: '',
    solution: '',
    technician_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: mains } = await supabase
      .from('it_maintenances')
      .select(`
        *,
        asset:it_assets(name, patrimony_code),
        technician:it_responsibles(name)
      `)
      .order('maintenance_date', { ascending: false });

    const { data: assetList } = await supabase.from('it_assets').select('id, name, patrimony_code').order('name');
    const { data: respList } = await supabase.from('it_responsibles').select('id, name').order('name');

    setMaintenances(mains || []);
    setAssets(assetList || []);
    setResponsibles(respList || []);
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.asset_id) {
      setAlertMessage('Selecione o equipamento.');
      return;
    }
    const payload = {
      ...form,
      technician_id: form.technician_id || null,
    };
    const { error } = await supabase.from('it_maintenances').insert([payload]);
    if (error) setAlertMessage('Erro ao registrar: ' + error.message);
    else {
      setShowForm(false);
      setForm({
        asset_id: '', maintenance_date: new Date().toISOString().split('T')[0],
        maintenance_type: 'Corretiva', problem: '', solution: '',
        technician_id: '', notes: '',
      });
      fetchAll();
      setToastMessage('Manutenção registrada com sucesso!');
    }
  }

  const typeColor = {
    'Corretiva': 'badge-danger',
    'Preventiva': 'badge-info',
    'Instalação': 'badge-success',
    'Outro': 'badge-warning',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>Manutenções</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Registro de serviços e intervenções técnicas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={18} /> Nova Manutenção
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '20px' }}>Registrar Manutenção</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Equipamento *</label>
                <Select className="input" name="asset_id" value={form.asset_id} onChange={handleChange} required>
                  <option value="">Selecione o ativo...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.patrimony_code} — {a.name}</option>)}
                </Select>
              </div>
              <div className="input-group">
                <label>Data *</label>
                <input type="date" className="input" name="maintenance_date" value={form.maintenance_date} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Tipo de Manutenção</label>
                <Select className="input" name="maintenance_type" value={form.maintenance_type} onChange={handleChange}>
                  <option>Corretiva</option>
                  <option>Preventiva</option>
                  <option>Instalação</option>
                  <option>Outro</option>
                </Select>
              </div>
              <div className="input-group">
                <label>Técnico Responsável</label>
                <Select className="input" name="technician_id" value={form.technician_id} onChange={handleChange}>
                  <option value="">Selecione...</option>
                  {responsibles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Problema Encontrado</label>
                <textarea className="input" name="problem" value={form.problem} onChange={handleChange} rows={3} placeholder="Descreva o problema..." />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Solução Aplicada</label>
                <textarea className="input" name="solution" value={form.solution} onChange={handleChange} rows={3} placeholder="Descreva a solução..." />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Observações</label>
                <textarea className="input" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Observações adicionais..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Registrar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Carregando manutenções...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Equipamento</th>
                <th>Tipo</th>
                <th>Problema</th>
                <th>Solução</th>
                <th>Técnico</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.map(mn => (
                <tr key={mn.id}>
                  <td>{new Date(mn.maintenance_date).toLocaleDateString('pt-BR')}</td>
                  <td><strong>{mn.asset?.patrimony_code}</strong><br/><small style={{ color: 'var(--text-secondary)' }}>{mn.asset?.name}</small></td>
                  <td><span className={`badge ${typeColor[mn.maintenance_type] || 'badge-info'}`}>{mn.maintenance_type}</span></td>
                  <td style={{ maxWidth: '200px', fontSize: '13px' }}>{mn.problem || '-'}</td>
                  <td style={{ maxWidth: '200px', fontSize: '13px' }}>{mn.solution || '-'}</td>
                  <td>{mn.technician?.name || '-'}</td>
                </tr>
              ))}
              {maintenances.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    <Wrench size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <br />Nenhuma manutenção registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AlertModal
        open={!!alertMessage}
        title="Atenção"
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
