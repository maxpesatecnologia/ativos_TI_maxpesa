import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, ArrowLeftRight } from 'lucide-react';
import Select from '../components/Select';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [assets, setAssets] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    asset_id: '',
    movement_date: new Date().toISOString().split('T')[0],
    previous_responsible_id: '',
    new_responsible_id: '',
    previous_location: '',
    new_location: '',
    notes: '',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: mvs } = await supabase
      .from('it_movements')
      .select(`
        *,
        asset:it_assets(name, patrimony_code),
        previous_responsible:it_responsibles!it_movements_previous_responsible_id_fkey(name),
        new_responsible:it_responsibles!it_movements_new_responsible_id_fkey(name)
      `)
      .order('movement_date', { ascending: false });

    const { data: assetList } = await supabase.from('it_assets').select('id, name, patrimony_code').order('name');
    const { data: respList } = await supabase.from('it_responsibles').select('id, name').order('name');

    setMovements(mvs || []);
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
      alert('Selecione o equipamento.');
      return;
    }
    const payload = {
      ...form,
      previous_responsible_id: form.previous_responsible_id || null,
      new_responsible_id: form.new_responsible_id || null,
    };
    const { error } = await supabase.from('it_movements').insert([payload]);
    if (error) alert('Erro ao registrar: ' + error.message);
    else {
      setShowForm(false);
      setForm({
        asset_id: '', movement_date: new Date().toISOString().split('T')[0],
        previous_responsible_id: '', new_responsible_id: '',
        previous_location: '', new_location: '', notes: '',
      });
      fetchAll();
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>Movimentações</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Registro de todas as trocas de responsável ou local.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={18} /> Nova Movimentação
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '20px' }}>Registrar Movimentação</h3>
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
                <input type="date" className="input" name="movement_date" value={form.movement_date} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Responsável Anterior</label>
                <Select className="input" name="previous_responsible_id" value={form.previous_responsible_id} onChange={handleChange}>
                  <option value="">Nenhum</option>
                  {responsibles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </div>
              <div className="input-group">
                <label>Novo Responsável</label>
                <Select className="input" name="new_responsible_id" value={form.new_responsible_id} onChange={handleChange}>
                  <option value="">Nenhum</option>
                  {responsibles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </div>
              <div className="input-group">
                <label>Local Anterior</label>
                <input className="input" name="previous_location" value={form.previous_location} onChange={handleChange} placeholder="Sala, setor..." />
              </div>
              <div className="input-group">
                <label>Novo Local</label>
                <input className="input" name="new_location" value={form.new_location} onChange={handleChange} placeholder="Sala, setor..." />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Observações</label>
                <textarea className="input" name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Motivo da movimentação..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Registrar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Carregando movimentações...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Equipamento</th>
                <th>Responsável Anterior</th>
                <th>Novo Responsável</th>
                <th>Local Anterior</th>
                <th>Novo Local</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(mv => (
                <tr key={mv.id}>
                  <td>{new Date(mv.movement_date).toLocaleDateString('pt-BR')}</td>
                  <td><strong>{mv.asset?.patrimony_code}</strong> <br/><small style={{ color: 'var(--text-secondary)' }}>{mv.asset?.name}</small></td>
                  <td>{mv.previous_responsible?.name || '-'}</td>
                  <td>{mv.new_responsible?.name || '-'}</td>
                  <td>{mv.previous_location || '-'}</td>
                  <td>{mv.new_location || '-'}</td>
                  <td style={{ maxWidth: '200px', color: 'var(--text-secondary)', fontSize: '13px' }}>{mv.notes || '-'}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    <ArrowLeftRight size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <br />Nenhuma movimentação registrada.
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
