import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, PackageCheck, Wrench, TrendingDown, BarChart2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '24px',
      borderTop: `4px solid ${color}`,
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          {label}
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: '36px', fontWeight: '900', color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, inUse: 0, stock: 0, maintenance: 0, retired: 0 });
  const [categoryData, setCategoryData] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const { data: assets } = await supabase.from('it_assets').select('status, category:it_categories(name)');
    if (assets) {
      const total = assets.length;
      const inUse = assets.filter(a => a.status === 'Em uso').length;
      const stock = assets.filter(a => a.status === 'Estoque').length;
      const maintenance = assets.filter(a => a.status === 'Manutenção').length;
      const retired = assets.filter(a => a.status === 'Baixado').length;
      setStats({ total, inUse, stock, maintenance, retired });

      // Agrupar por categoria
      const catMap = {};
      assets.forEach(a => {
        const name = a.category?.name || 'Sem categoria';
        catMap[name] = (catMap[name] || 0) + 1;
      });
      setCategoryData({ labels: Object.keys(catMap), values: Object.values(catMap) });
    }

    setLoading(false);
  }

  const chartData = {
    labels: categoryData.labels,
    datasets: [{
      data: categoryData.values,
      backgroundColor: ['#E30613', '#111111', '#666666', '#FF6A00', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'],
      borderWidth: 0,
    }],
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ marginBottom: '4px' }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Visão geral do inventário de ativos de TI.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard label="Total de Ativos" value={stats.total} icon={BarChart2} color="#111111" />
        <StatCard label="Em Uso" value={stats.inUse} icon={Monitor} color="#10b981" />
        <StatCard label="Estoque" value={stats.stock} icon={PackageCheck} color="#0ea5e9" />
        <StatCard label="Manutenção" value={stats.maintenance} icon={Wrench} color="#FF6A00" />
        <StatCard label="Baixados" value={stats.retired} icon={TrendingDown} color="#E30613" />
      </div>

      {/* Gráfico */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3>Ativos por Categoria</h3>
          {categoryData.labels.length > 0 ? (
            <div style={{ maxWidth: '320px', margin: '0 auto' }}>
              <Doughnut
                data={chartData}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: 'var(--text-primary)', font: { size: 12 }, padding: 16 }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              Nenhum ativo cadastrado ainda.
            </p>
          )}
        </div>

        <div className="card">
          <h3>Distribuição por Status</h3>
          {stats.total > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
              {[
                { label: 'Em Uso', value: stats.inUse, color: '#10b981' },
                { label: 'Estoque', value: stats.stock, color: '#0ea5e9' },
                { label: 'Manutenção', value: stats.maintenance, color: '#FF6A00' },
                { label: 'Baixados', value: stats.retired, color: '#E30613' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: '800', color: item.color }}>{item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%`,
                      background: item.color,
                      height: '100%',
                      borderRadius: '4px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>Sem dados disponíveis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
