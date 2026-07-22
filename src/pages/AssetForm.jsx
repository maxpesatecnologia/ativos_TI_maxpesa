import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import Select from '../components/Select';
import Toast from '../components/Toast';

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipoDoFiltro = searchParams.get('tipo'); // 'Hardware' | 'Licença' | 'Celular' vindo da aba de origem em /assets
  const isEditing = !!id;

  const [categories, setCategories] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    patrimony_code: '',
    name: '',
    category_id: '',
    brand: '',
    model: '',
    serial_number: '',
    status: 'Estoque',
    processor: '',
    ram: '',
    storage: '',
    os: '',
    ip_address: '',
    mac_address: '',
    license_type: '',
    license_email: '',
    phone_number: '',
    carrier: '',
    imei_device: '',
    imei_chip: '',
    responsible_id: '',
    physical_location: '',
    delivery_date: '',
    photo_url: ''
  });

  const categoriaSelecionada = categories.find(c => c.id === formData.category_id);
  const tipoCategoria = categoriaSelecionada?.tipo || (!isEditing && tipoDoFiltro) || 'Hardware';

  // Em um novo ativo aberto a partir de um filtro (Hardware/Licença/Celular), só mostra as categorias daquele tipo
  const categoriasDisponiveis = (!isEditing && tipoDoFiltro)
    ? categories.filter(c => c.tipo === tipoDoFiltro)
    : categories;

  useEffect(() => {
    fetchOptions();
    if (isEditing) {
      fetchAsset();
    }
  }, [id]);

  // Licença não tem seletor de Categoria no formulário: usa automaticamente
  // a primeira categoria do tipo "Licença" cadastrada.
  useEffect(() => {
    if (!isEditing && tipoCategoria === 'Licença' && !formData.category_id && categoriasDisponiveis.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categoriasDisponiveis[0].id }));
    }
  }, [isEditing, tipoCategoria, categoriasDisponiveis, formData.category_id]);

  // Celular não tem Nome do Equipamento nem seletor de Categoria no formulário:
  // usa automaticamente a categoria "Smartphone Corporativo" (ou a primeira do tipo "Celular").
  useEffect(() => {
    if (!isEditing && tipoCategoria === 'Celular' && !formData.category_id && categoriasDisponiveis.length > 0) {
      const smartphoneCorporativo = categoriasDisponiveis.find(c => c.name.trim().toLowerCase() === 'smartphone corporativo');
      setFormData(prev => ({ ...prev, category_id: (smartphoneCorporativo || categoriasDisponiveis[0]).id }));
    }
  }, [isEditing, tipoCategoria, categoriasDisponiveis, formData.category_id]);

  async function fetchOptions() {
    const { data: cats } = await supabase.from('it_categories').select('*').order('name');
    setCategories(cats || []);

    const { data: resps } = await supabase.from('it_responsibles').select('*, department:it_departments(name)').order('name');
    setResponsibles(resps || []);

    const { data: deps } = await supabase.from('it_departments').select('*').order('name');
    setDepartments(deps || []);
  }

  async function fetchAsset() {
    const { data, error } = await supabase.from('it_assets').select('*').eq('id', id).single();
    if (data) {
      setFormData({
        ...data,
        responsible_id: data.responsible_id || '',
        category_id: data.category_id || '',
        delivery_date: data.delivery_date ? data.delivery_date.split('T')[0] : ''
      });
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function gerarPatrimonioAutomatico() {
    const { data } = await supabase
      .from('it_assets')
      .select('patrimony_code')
      .like('patrimony_code', 'AT-%')
      .order('patrimony_code', { ascending: false })
      .limit(1);
    const ultimo = data?.[0]?.patrimony_code;
    const numero = ultimo ? parseInt(ultimo.replace('AT-', ''), 10) + 1 : 1;
    return `AT-${String(numero).padStart(4, '0')}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.category_id) {
      setFormError('Selecione a categoria antes de salvar.');
      return;
    }

    if (tipoCategoria === 'Licença' && formData.license_type.trim() && formData.license_email.trim()) {
      let duplicateQuery = supabase
        .from('it_assets')
        .select('patrimony_code')
        .ilike('license_type', formData.license_type.trim())
        .ilike('license_email', formData.license_email.trim());
      if (isEditing) duplicateQuery = duplicateQuery.neq('id', id);
      const { data: duplicados } = await duplicateQuery;
      if (duplicados && duplicados.length > 0) {
        setFormError(
          `Esta licença já está cadastrada: "${formData.license_type.trim()}" vinculada a ${formData.license_email.trim()} ` +
          `(patrimônio ${duplicados[0].patrimony_code}). Edite o cadastro existente em vez de criar um novo.`
        );
        return;
      }
    }

    setLoading(true);

    const payload = {
      ...formData,
      name: tipoCategoria === 'Licença'
        ? (formData.license_type || 'Licença')
        : tipoCategoria === 'Celular'
          ? (formData.phone_number ? `Smartphone Corporativo - ${formData.phone_number}` : 'Smartphone Corporativo')
          : formData.name,
      patrimony_code: formData.patrimony_code || await gerarPatrimonioAutomatico(),
      category_id: formData.category_id || null,
      responsible_id: formData.responsible_id || null,
      delivery_date: formData.delivery_date || null
    };

    if (isEditing) {
      const { error } = await supabase.from('it_assets').update(payload).eq('id', id);
      if (error) setFormError('Não foi possível atualizar o ativo: ' + error.message);
      else {
        navigate('/assets', { state: { toast: 'Ativo atualizado com sucesso!' } });
        return;
      }
    } else {
      const { error } = await supabase.from('it_assets').insert([payload]);
      if (error) setFormError('Não foi possível cadastrar o ativo: ' + error.message);
      else {
        navigate('/assets', { state: { toast: 'Ativo adicionado com sucesso!' } });
        return;
      }
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/assets')} className="btn btn-outline" style={{ padding: '8px', border: 'none' }}>
          <ArrowLeft size={20} />
        </button>
        <h2>
          {isEditing ? 'Editar Ativo' : 'Novo Ativo'}
          {!isEditing && tipoDoFiltro && ` — ${tipoDoFiltro}`}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        {tipoCategoria === 'Licença' ? (
          <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Informações da Licença</h3>

              <div className="input-group">
                <label>Tipo da Licença</label>
                <input className="input" name="license_type" placeholder="Ex: Office 365, Windows Server, Antivírus..." value={formData.license_type} onChange={handleChange} />
              </div>

              <div className="input-group">
                <label>E-mail Vinculado</label>
                <input type="email" className="input" name="license_email" placeholder="usuario@maxpesa.com.br" value={formData.license_email} onChange={handleChange} />
              </div>

              <div className="input-group">
                <label>Status *</label>
                <Select required className="input" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Estoque">Estoque</option>
                  <option value="Em uso">Em uso</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Baixado">Baixado</option>
                </Select>
              </div>

              {!isEditing && categoriasDisponiveis.length === 0 && (
                <small style={{ color: 'var(--status-warning)' }}>
                  Nenhuma categoria do tipo "Licença" cadastrada ainda. Crie uma em Categorias antes de continuar.
                </small>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Localização e Responsável</h3>

              <div className="input-group">
                <label>Responsável</label>
                <Select className="input" name="responsible_id" value={formData.responsible_id} onChange={handleChange}>
                  <option value="">Nenhum</option>
                  {responsibles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.department?.name})</option>)}
                </Select>
              </div>

              <div className="input-group">
                <label>Local Físico (Departamento)</label>
                <Select className="input" name="physical_location" value={formData.physical_location} onChange={handleChange}>
                  <option value="">Selecione...</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}{d.unit ? ` (${d.unit})` : ''}</option>)}
                </Select>
              </div>

              <div className="input-group">
                <label>Data de Entrega</label>
                <input type="date" className="input" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* Seção 1: Geral */}
            <div className="card">
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Informações Gerais</h3>

              {tipoCategoria !== 'Celular' && (
                <div className="input-group">
                  <label>Nome do Equipamento *</label>
                  <input required className="input" name="name" value={formData.name} onChange={handleChange} />
                </div>
              )}

              {tipoCategoria !== 'Celular' && (
                <div className="input-group">
                  <label>Categoria *</label>
                  <Select required className="input" name="category_id" value={formData.category_id} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {categoriasDisponiveis.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  {!isEditing && tipoDoFiltro && categoriasDisponiveis.length === 0 && (
                    <small style={{ color: 'var(--status-warning)' }}>
                      Nenhuma categoria do tipo "{tipoDoFiltro}" cadastrada ainda. Crie uma em Categorias antes de continuar.
                    </small>
                  )}
                </div>
              )}

              {tipoCategoria === 'Celular' && !isEditing && categoriasDisponiveis.length === 0 && (
                <small style={{ color: 'var(--status-warning)', display: 'block', marginBottom: '14px' }}>
                  Nenhuma categoria do tipo "Celular" cadastrada ainda. Crie uma chamada "Smartphone Corporativo" em Categorias antes de continuar.
                </small>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Marca</label>
                  <input className="input" name="brand" value={formData.brand} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Modelo</label>
                  <input className="input" name="model" value={formData.model} onChange={handleChange} />
                </div>
              </div>

              <div className="input-group">
                <label>Número de Série</label>
                <input className="input" name="serial_number" value={formData.serial_number} onChange={handleChange} />
              </div>

              <div className="input-group">
                <label>Status *</label>
                <Select required className="input" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Estoque">Estoque</option>
                  <option value="Em uso">Em uso</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Baixado">Baixado</option>
                </Select>
              </div>

              <div className="input-group">
                <label>URL da Foto (Opcional)</label>
                <input className="input" name="photo_url" value={formData.photo_url} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Seção 2: campos específicos por tipo de categoria */}
              {tipoCategoria === 'Hardware' && (
                <div className="card">
                  <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Informações Técnicas</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Processador</label>
                      <input className="input" name="processor" value={formData.processor} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Memória RAM</label>
                      <input className="input" name="ram" value={formData.ram} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Armazenamento</label>
                      <input className="input" name="storage" value={formData.storage} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Sistema Operacional</label>
                      <input className="input" name="os" value={formData.os} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Endereço IP</label>
                      <input className="input" name="ip_address" value={formData.ip_address} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Endereço MAC</label>
                      <input className="input" name="mac_address" value={formData.mac_address} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              {tipoCategoria === 'Celular' && (
                <div className="card">
                  <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Informações do Celular</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Nº Telefone</label>
                      <input className="input" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Operadora</label>
                      <input className="input" name="carrier" value={formData.carrier} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>IMEI do Aparelho</label>
                      <input className="input" name="imei_device" value={formData.imei_device} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>IMEI do Chip</label>
                      <input className="input" name="imei_chip" value={formData.imei_chip} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              {/* Seção 3: Localização */}
              <div className="card">
                <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Localização e Responsável</h3>

                <div className="input-group">
                  <label>Responsável</label>
                  <Select className="input" name="responsible_id" value={formData.responsible_id} onChange={handleChange}>
                    <option value="">Nenhum</option>
                    {responsibles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.department?.name})</option>)}
                  </Select>
                </div>

                <div className="input-group">
                  <label>Local Físico (Departamento)</label>
                  <Select className="input" name="physical_location" value={formData.physical_location} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}{d.unit ? ` (${d.unit})` : ''}</option>)}
                  </Select>
                </div>

                <div className="input-group">
                  <label>Data de Entrega</label>
                  <input type="date" className="input" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
                </div>
              </div>
            </div>

          </div>
        )}

        <Toast
          open={!!formError}
          tone="danger"
          message={formError}
          duration={6000}
          onClose={() => setFormError('')}
        />

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/assets')} className="btn btn-outline">Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Ativo'}
          </button>
        </div>
      </form>
    </div>
  );
}
