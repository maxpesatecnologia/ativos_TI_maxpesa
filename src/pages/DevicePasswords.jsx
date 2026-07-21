import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Pencil, Eye, EyeOff, Lock } from 'lucide-react';
import './DevicePasswords.css';

const emptyForm = { deviceType: 'notebook', deviceName: '', departmentId: '', plainPassword: '' };

export default function DevicePasswords() {
  const [unlocked, setUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  const [devices, setDevices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    if (unlocked) fetchDepartments();
  }, [unlocked]);

  async function fetchDepartments() {
    const { data } = await supabase.from('it_departments').select('*').order('name');
    setDepartments(data || []);
  }

  async function fetchDevices(passwordToUse) {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_device_passwords', { vault_password: passwordToUse });
    setLoading(false);
    if (error) return { error };
    setDevices(data || []);
    return { error: null };
  }

  async function handleUnlock(e) {
    e.preventDefault();
    setGateError('');
    setGateLoading(true);
    const { error } = await fetchDevices(gateInput);
    setGateLoading(false);
    if (error) {
      setGateError('Senha do cofre incorreta.');
      return;
    }
    setVaultPassword(gateInput);
    setGateInput('');
    setUnlocked(true);
  }

  function handleLock() {
    setUnlocked(false);
    setVaultPassword('');
    setDevices([]);
    setRevealed({});
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function startEdit(device) {
    setEditingId(device.id);
    setForm({
      deviceType: device.device_type,
      deviceName: device.device_name,
      departmentId: device.department_id || '',
      plainPassword: device.password,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.deviceName.trim() || !form.plainPassword) return;

    const params = {
      p_device_type: form.deviceType,
      p_device_name: form.deviceName,
      p_department_id: form.departmentId || null,
      p_plain_password: form.plainPassword,
      p_vault_password: vaultPassword,
    };

    const { error } = editingId
      ? await supabase.rpc('update_device_password', { p_id: editingId, ...params })
      : await supabase.rpc('add_device_password', params);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchDevices(vaultPassword);
  }

  async function handleDelete(id) {
    if (!confirm('Deseja excluir este registro?')) return;
    const { error } = await supabase.from('it_device_passwords').delete().eq('id', id);
    if (!error) fetchDevices(vaultPassword);
    else alert('Erro ao excluir: ' + error.message);
  }

  function toggleReveal(id) {
    setRevealed(r => ({ ...r, [id]: !r[id] }));
  }

  if (!unlocked) {
    return (
      <div className="vault-gate-wrap">
        <div className="vault-gate-card">
          <div className="vault-gate-icon">
            <Lock size={28} color="#fff" />
          </div>
          <h3 className="vault-gate-title">Cofre de Senhas</h3>
          <p className="vault-gate-subtitle">Área restrita e criptografada.<br />Informe a senha do cofre para continuar.</p>
          <form onSubmit={handleUnlock}>
            <div className="input-group">
              <label>Senha do Cofre</label>
              <input
                className="input"
                type="password"
                value={gateInput}
                onChange={e => setGateInput(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>
            {gateError && <p className="vault-gate-error">{gateError}</p>}
            <button type="submit" className="btn btn-primary vault-gate-submit" disabled={gateLoading}>
              {gateLoading ? 'Verificando...' : 'Desbloquear'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Senhas de Dispositivos</h2>
        <button onClick={handleLock} className="btn btn-outline">
          <Lock size={16} /> Bloquear
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          className="input"
          value={form.deviceType}
          onChange={e => handleChange('deviceType', e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="notebook">Notebook</option>
          <option value="desktop">Desktop</option>
        </select>
        <input
          className="input"
          value={form.deviceName}
          onChange={e => handleChange('deviceName', e.target.value)}
          placeholder="Nome do dispositivo (ex: NOTE-JOAO-01)"
          style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }}
          required
        />
        <select
          className="input"
          value={form.departmentId}
          onChange={e => handleChange('departmentId', e.target.value)}
          style={{ minWidth: '200px', maxWidth: '280px' }}
        >
          <option value="">Departamento...</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.unit ? ` (${d.unit})` : ''}</option>)}
        </select>
        <input
          className="input"
          type="text"
          value={form.plainPassword}
          onChange={e => handleChange('plainPassword', e.target.value)}
          placeholder="Senha da máquina"
          style={{ flex: 1, minWidth: '160px', maxWidth: '220px' }}
          required
        />
        <button type="submit" className="btn btn-primary">
          {editingId ? <><Pencil size={18} /> Salvar</> : <><Plus size={18} /> Adicionar</>}
        </button>
        {editingId && (
          <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancelar</button>
        )}
      </form>

      {loading ? <p>Carregando...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Dispositivo</th>
                <th>Departamento</th>
                <th>Senha</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => {
                const dept = departments.find(dep => dep.id === d.department_id);
                return (
                  <tr key={d.id}>
                    <td>
                      <span className={d.device_type === 'notebook' ? 'badge badge-info' : 'badge badge-warning'}>
                        {d.device_type === 'notebook' ? 'Notebook' : 'Desktop'}
                      </span>
                    </td>
                    <td>{d.device_name}</td>
                    <td>{dept ? `${dept.name}${dept.unit ? ` (${dept.unit})` : ''}` : '—'}</td>
                    <td style={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {revealed[d.id] ? d.password : '••••••••'}
                      <button
                        onClick={() => toggleReveal(d.id)}
                        className="btn btn-outline"
                        title={revealed[d.id] ? 'Ocultar' : 'Mostrar'}
                        style={{ padding: '4px', borderColor: 'transparent' }}
                      >
                        {revealed[d.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => startEdit(d)}
                        className="btn btn-outline"
                        title="Editar"
                        style={{ padding: '6px', borderColor: 'transparent' }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="btn btn-outline"
                        title="Excluir"
                        style={{ padding: '6px', color: 'var(--status-danger)', borderColor: 'transparent' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nenhum dispositivo cadastrado.
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
