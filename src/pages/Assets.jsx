import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Toast from '../components/Toast';

const FILTROS = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Hardware', label: 'Notebook / Desktop' },
  { key: 'Licença', label: 'Licenças' },
  { key: 'Celular', label: 'Celulares' },
];

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [deleteId, setDeleteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToastMessage(location.state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  async function fetchAssets() {
    setLoading(true);
    const { data, error } = await supabase
      .from('it_assets')
      .select(`
        *,
        category:it_categories(name, tipo),
        responsible:it_responsibles(name, department:it_departments(name))
      `)
      .order('created_at', { ascending: false });

    if (!error) setAssets(data || []);
    setLoading(false);
  }

  function handleDelete(id) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    const id = deleteId;
    setDeleteId(null);
    const { error } = await supabase.from('it_assets').delete().eq('id', id);
    if (!error) {
      fetchAssets();
      setToastMessage('Ativo excluído com sucesso!');
    } else setAlertMessage('Erro ao excluir: ' + error.message);
  }

  const filteredAssets = assets.filter(asset => {
    if (activeFilter !== 'Todos' && (asset.category?.tipo || 'Hardware') !== activeFilter) return false;
    const termo = searchTerm.toLowerCase();
    return asset.name.toLowerCase().includes(termo) ||
      asset.patrimony_code.toLowerCase().includes(termo) ||
      (asset.license_type || '').toLowerCase().includes(termo) ||
      (asset.responsible?.name || '').toLowerCase().includes(termo) ||
      (asset.physical_location || '').toLowerCase().includes(termo);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Gestão de Ativos</h2>
        <Link to={activeFilter === 'Todos' ? '/assets/new' : `/assets/new?tipo=${encodeURIComponent(activeFilter)}`} className="btn btn-primary">
          <Plus size={18} /> Novo Ativo
        </Link>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`btn ${activeFilter === f.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, maxWidth: '400px', flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
          <input
            className="input"
            placeholder="Buscar por nome ou patrimônio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>
      </div>

      {loading ? <p>Carregando ativos...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patrimônio</th>
                <th>{activeFilter === 'Celular' ? 'Aparelho' : activeFilter === 'Licença' ? 'Software' : 'Equipamento'}</th>
                {activeFilter === 'Todos' && <th>Categoria</th>}
                {activeFilter === 'Hardware' && <th>Processador / RAM</th>}
                {activeFilter === 'Licença' && <th>Tipo de Licença</th>}
                {activeFilter === 'Celular' && <th>Nº Telefone</th>}
                {activeFilter === 'Celular' && <th>Operadora</th>}
                {activeFilter === 'Celular' && <th>IMEI (Aparelho / Chip)</th>}
                <th>Status</th>
                <th>Responsável / Local</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset.id}>
                  <td><strong>{asset.patrimony_code}</strong></td>
                  <td>{asset.name} <br/><small style={{ color: 'var(--text-secondary)' }}>{asset.brand} {asset.model}</small></td>
                  {activeFilter === 'Todos' && <td>{asset.category?.name}</td>}
                  {activeFilter === 'Hardware' && (
                    <td>{asset.processor || '—'} <br/><small style={{ color: 'var(--text-secondary)' }}>{asset.ram}</small></td>
                  )}
                  {activeFilter === 'Licença' && <td>{asset.license_type || '—'}</td>}
                  {activeFilter === 'Celular' && <td>{asset.phone_number || '—'}</td>}
                  {activeFilter === 'Celular' && <td>{asset.carrier || '—'}</td>}
                  {activeFilter === 'Celular' && (
                    <td>{asset.imei_device || '—'} <br/><small style={{ color: 'var(--text-secondary)' }}>{asset.imei_chip || '—'}</small></td>
                  )}
                  <td>
                    <span className={`badge badge-${asset.status === 'Em uso' ? 'success' : asset.status === 'Estoque' ? 'info' : asset.status === 'Manutenção' ? 'warning' : 'danger'}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    {asset.responsible ? (
                      <>
                        {asset.responsible.name} <br/>
                        <small style={{ color: 'var(--text-secondary)' }}>{asset.responsible.department?.name}</small>
                      </>
                    ) : asset.physical_location || 'Não atribuído'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => navigate(`/assets/edit/${asset.id}`)} className="btn btn-outline" title="Editar" style={{ padding: '6px', borderColor: 'transparent' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="btn btn-outline" title="Excluir" style={{ padding: '6px', color: 'var(--status-danger)', borderColor: 'transparent' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={activeFilter === 'Celular' ? 8 : activeFilter === 'Todos' ? 6 : 6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nenhum ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        message="Deseja realmente excluir este ativo? O histórico será perdido."
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
