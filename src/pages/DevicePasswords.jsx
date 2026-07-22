import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Pencil, Eye, EyeOff, Lock, FileText, Sheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Select from '../components/Select';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Toast from '../components/Toast';
import './DevicePasswords.css';

function formatDept(departments, departmentId) {
  const dept = departments.find(dep => dep.id === departmentId);
  return dept ? `${dept.name}${dept.unit ? ` (${dept.unit})` : ''}` : '-';
}

function exportPasswordsPDF(devices, departments, password) {
  const doc = new jsPDF({
    orientation: 'landscape',
    encryption: { userPassword: password, ownerPassword: password },
  });

  doc.setFillColor(227, 6, 19);
  doc.rect(0, 0, doc.internal.pageSize.width, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GRUPO MAXPESA — Cofre de Senhas de Dispositivos', 14, 12);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Senhas de Dispositivos', 14, 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 34);
  doc.text('Arquivo protegido por senha. Trate com confidencialidade.', 14, 39);

  autoTable(doc, {
    startY: 45,
    head: [['Tipo', 'Dispositivo', 'Departamento', 'Senha']],
    body: devices.map(d => [
      d.device_type === 'notebook' ? 'Notebook' : 'Desktop',
      d.device_name,
      formatDept(departments, d.department_id),
      d.password,
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`Senhas_de_Dispositivos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
}

function exportPasswordsExcel(devices, departments) {
  const rows = devices.map(d => ({
    Tipo: d.device_type === 'notebook' ? 'Notebook' : 'Desktop',
    Dispositivo: d.device_name,
    Departamento: formatDept(departments, d.department_id),
    Senha: d.password,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Senhas');
  XLSX.writeFile(wb, `Senhas_de_Dispositivos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
}

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
  const [deleteId, setDeleteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [reportMode, setReportMode] = useState(null); // 'pdf' | 'excel' | null
  const [reportPasswordInput, setReportPasswordInput] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

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

    const wasEditing = !!editingId;
    const { error } = editingId
      ? await supabase.rpc('update_device_password', { p_id: editingId, ...params })
      : await supabase.rpc('add_device_password', params);

    if (error) {
      setAlertMessage('Erro ao salvar: ' + error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchDevices(vaultPassword);
    setToastMessage(wasEditing ? 'Registro atualizado com sucesso!' : 'Registro adicionado com sucesso!');
  }

  function handleDelete(id) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    const id = deleteId;
    setDeleteId(null);
    const { error } = await supabase.from('it_device_passwords').delete().eq('id', id);
    if (!error) {
      fetchDevices(vaultPassword);
      setToastMessage('Registro excluído com sucesso!');
    } else setAlertMessage('Erro ao excluir: ' + error.message);
  }

  function toggleReveal(id) {
    setRevealed(r => ({ ...r, [id]: !r[id] }));
  }

  function openReportModal(mode) {
    setReportMode(mode);
    setReportPasswordInput('');
    setReportError('');
  }

  function closeReportModal() {
    setReportMode(null);
    setReportPasswordInput('');
    setReportError('');
  }

  async function confirmReport(e) {
    e.preventDefault();
    setReportError('');
    setReportLoading(true);
    const { data, error } = await supabase.rpc('list_device_passwords', { vault_password: reportPasswordInput });
    setReportLoading(false);

    if (error) {
      setReportError('Senha do cofre incorreta.');
      return;
    }

    if (reportMode === 'pdf') exportPasswordsPDF(data || [], departments, reportPasswordInput);
    else exportPasswordsExcel(data || [], departments);

    closeReportModal();
    setToastMessage('Relatório gerado com sucesso!');
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, minWidth: 0 }}>Senhas de Dispositivos</h2>
        <button onClick={handleLock} className="btn btn-outline" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Lock size={16} /> Bloquear
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          title="Exportar PDF protegido por senha"
          onClick={() => openReportModal('pdf')}
        >
          <FileText size={16} /> PDF
        </button>
        <button
          type="button"
          className="btn"
          style={{ flexShrink: 0, whiteSpace: 'nowrap', backgroundColor: 'var(--status-success)', color: '#FFFFFF' }}
          title="Exportar Excel (arquivo sem senha)"
          onClick={() => openReportModal('excel')}
        >
          <Sheet size={16} /> Excel
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Select
          className="input"
          value={form.deviceType}
          onChange={e => handleChange('deviceType', e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="notebook">Notebook</option>
          <option value="desktop">Desktop</option>
        </Select>
        <input
          className="input"
          value={form.deviceName}
          onChange={e => handleChange('deviceName', e.target.value)}
          placeholder="Nome do dispositivo (ex: NOTE-JOAO-01)"
          style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }}
          required
        />
        <Select
          className="input"
          value={form.departmentId}
          onChange={e => handleChange('departmentId', e.target.value)}
          style={{ minWidth: '200px', maxWidth: '280px' }}
        >
          <option value="">Departamento...</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.unit ? ` (${d.unit})` : ''}</option>)}
        </Select>
        <input
          className="input"
          type="text"
          value={form.plainPassword}
          onChange={e => handleChange('plainPassword', e.target.value)}
          placeholder="Senha da máquina"
          style={{ flex: 1, minWidth: '160px', maxWidth: '220px' }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          {editingId ? <><Pencil size={18} /> Salvar</> : <><Plus size={18} /> Adicionar</>}
        </button>
        {editingId && (
          <button type="button" className="btn btn-outline" style={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={cancelEdit}>Cancelar</button>
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
                    <td style={{ fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {revealed[d.id] ? d.password : '••••••••'}
                        <button
                          onClick={() => toggleReveal(d.id)}
                          className="btn btn-outline"
                          title={revealed[d.id] ? 'Ocultar' : 'Mostrar'}
                          style={{ padding: '4px', borderColor: 'transparent' }}
                        >
                          {revealed[d.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
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

      <ConfirmModal
        open={!!deleteId}
        message="Deseja excluir este registro?"
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

      <Modal open={!!reportMode} onClose={closeReportModal} title="Confirmar Senha do Cofre" icon={Lock}>
        <p style={{ marginBottom: '12px' }}>
          Digite novamente a senha do cofre para gerar o relatório em{' '}
          {reportMode === 'pdf'
            ? 'PDF (o arquivo sairá protegido com esta mesma senha).'
            : 'Excel (este arquivo não terá senha própria).'}
        </p>
        <form onSubmit={confirmReport}>
          <div className="input-group">
            <input
              className="input"
              type="password"
              value={reportPasswordInput}
              onChange={e => setReportPasswordInput(e.target.value)}
              placeholder="Senha do cofre"
              autoFocus
              required
            />
          </div>
          {reportError && (
            <p style={{ color: 'var(--status-danger)', fontSize: '13px', marginBottom: '12px' }}>{reportError}</p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={closeReportModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={reportLoading}>
              {reportLoading ? 'Verificando...' : 'Gerar Relatório'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
