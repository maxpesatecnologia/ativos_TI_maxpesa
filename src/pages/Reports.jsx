import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Sheet, Download, Loader } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
async function fetchForReport(type) {
  switch (type) {
    case 'general': {
      const { data } = await supabase
        .from('it_assets')
        .select(`patrimony_code, name, brand, model, serial_number, status,
          category:it_categories(name),
          responsible:it_responsibles(name, department:it_departments(name))`)
        .order('name');
      return data || [];
    }
    case 'by_department': {
      const { data } = await supabase
        .from('it_assets')
        .select(`patrimony_code, name, status,
          category:it_categories(name),
          responsible:it_responsibles(name, department:it_departments(name))`)
        .order('name');
      return data || [];
    }
    case 'by_responsible': {
      const { data } = await supabase
        .from('it_assets')
        .select(`patrimony_code, name, status,
          category:it_categories(name),
          responsible:it_responsibles(name, department:it_departments(name))`)
        .not('responsible_id', 'is', null)
        .order('name');
      return data || [];
    }
    case 'maintenance': {
      const { data } = await supabase
        .from('it_assets')
        .select(`patrimony_code, name, brand, model`)
        .eq('status', 'Manutenção');
      return data || [];
    }
    case 'retired': {
      const { data } = await supabase
        .from('it_assets')
        .select(`patrimony_code, name, brand, model`)
        .eq('status', 'Baixado');
      return data || [];
    }
    default: return [];
  }
}

function buildColumns(type) {
  switch (type) {
    case 'general':
      return [
        { header: 'Patrimônio', key: 'patrimony_code' },
        { header: 'Nome', key: 'name' },
        { header: 'Categoria', key: (r) => r.category?.name || '-' },
        { header: 'Marca', key: 'brand' },
        { header: 'Modelo', key: 'model' },
        { header: 'Nº de Série', key: 'serial_number' },
        { header: 'Status', key: 'status' },
        { header: 'Responsável', key: (r) => r.responsible?.name || '-' },
        { header: 'Departamento', key: (r) => r.responsible?.department?.name || '-' },
      ];
    case 'by_department':
    case 'by_responsible':
      return [
        { header: 'Patrimônio', key: 'patrimony_code' },
        { header: 'Nome', key: 'name' },
        { header: 'Categoria', key: (r) => r.category?.name || '-' },
        { header: 'Status', key: 'status' },
        { header: 'Responsável', key: (r) => r.responsible?.name || '-' },
        { header: 'Departamento', key: (r) => r.responsible?.department?.name || '-' },
      ];
    case 'maintenance':
    case 'retired':
      return [
        { header: 'Patrimônio', key: 'patrimony_code' },
        { header: 'Nome', key: 'name' },
        { header: 'Marca', key: 'brand' },
        { header: 'Modelo', key: 'model' },
        { header: 'Status', key: 'status' },
      ];
    default: return [];
  }
}

function resolveCell(row, col) {
  if (typeof col.key === 'function') return col.key(row) ?? '-';
  return row[col.key] ?? '-';
}

// -----------------------------------------------------------------------
// Exportadores
// -----------------------------------------------------------------------
function exportPDF(title, columns, rows) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Cabeçalho com marca
  doc.setFillColor(227, 6, 19);
  doc.rect(0, 0, doc.internal.pageSize.width, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GRUPO MAXPESA — Controle de Ativos de TI', 14, 12);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(col => resolveCell(row, col))),
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

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
}

function exportExcel(title, columns, rows) {
  const sheetData = [
    columns.map(c => c.header),
    ...rows.map(row => columns.map(col => resolveCell(row, col))),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
}

// -----------------------------------------------------------------------
// Componente de Card de Relatório
// -----------------------------------------------------------------------
function ReportCard({ icon: Icon, title, description, type, onExport }) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format) {
    setLoading(true);
    try {
      const rows = await fetchForReport(type);
      const columns = buildColumns(type);
      if (format === 'pdf') exportPDF(title, columns, rows);
      else exportExcel(title, columns, rows);
    } catch (e) {
      alert('Erro ao gerar relatório: ' + e.message);
    }
    setLoading(false);
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '8px',
          background: 'rgba(227,6,19,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={22} style={{ color: 'var(--brand-red)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', marginBottom: '2px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{title}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400 }}>{description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          className="btn btn-primary"
          onClick={() => handleExport('pdf')}
          disabled={loading}
          style={{ flex: 1, fontSize: '12px' }}
        >
          {loading ? <Loader size={15} className="spin" /> : <FileText size={15} />}
          Exportar PDF
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleExport('excel')}
          disabled={loading}
          style={{ flex: 1, fontSize: '12px' }}
        >
          {loading ? <Loader size={15} /> : <Sheet size={15} />}
          Exportar Excel
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Página principal
// -----------------------------------------------------------------------
const REPORTS = [
  {
    icon: Download,
    title: 'Inventário Geral',
    description: 'Todos os ativos com informações completas de categoria, responsável e status.',
    type: 'general',
  },
  {
    icon: Download,
    title: 'Ativos por Departamento',
    description: 'Lista de equipamentos agrupados por setor e departamento.',
    type: 'by_department',
  },
  {
    icon: Download,
    title: 'Ativos por Responsável',
    description: 'Equipamentos com responsável atribuído, útil para prestação de contas.',
    type: 'by_responsible',
  },
  {
    icon: Download,
    title: 'Equipamentos em Manutenção',
    description: 'Todos os ativos com status "Manutenção" no momento da geração.',
    type: 'maintenance',
  },
  {
    icon: Download,
    title: 'Equipamentos Baixados',
    description: 'Relação de todos os ativos descontinuados ou baixados do inventário.',
    type: 'retired',
  },
];

export default function Reports() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ marginBottom: '4px' }}>Relatórios</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Gere e exporte relatórios do inventário em PDF ou Excel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {REPORTS.map(r => (
          <ReportCard key={r.type} {...r} />
        ))}
      </div>
    </div>
  );
}
