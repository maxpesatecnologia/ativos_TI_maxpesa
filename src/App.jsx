import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, Users, Wrench, ArrowLeftRight,
  Tag, Building2, Sun, Moon, ChevronDown, ChevronRight, Settings, FileBarChart, Printer
} from 'lucide-react';

import Categories from './pages/Categories';
import Departments from './pages/Departments';
import Responsibles from './pages/Responsibles';
import Assets from './pages/Assets';
import AssetForm from './pages/AssetForm';
import Movements from './pages/Movements';
import Maintenances from './pages/Maintenances';
import Printers from './pages/Printers';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import logoMaxpesa from './assets/logo_branca_maxpesa.png';

// Link ativo na sidebar
function NavLink({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '4px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: isActive ? '700' : '500',
        color: isActive ? '#fff' : 'var(--sidebar-text)',
        background: isActive ? 'var(--brand-red)' : 'transparent',
        transition: 'all 0.15s',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      <Icon size={17} />
      {children}
    </Link>
  );
}

// Grupo colapsável de links no menu
function NavGroup({ icon: Icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
          color: 'var(--gray-light)', fontSize: '13px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
          marginTop: '8px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon size={17} /> {label}
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function AppLayout({ theme, toggleTheme }) {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #222',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '4px'
        }}>
          <img
            src={logoMaxpesa}
            alt="Grupo Maxpesa"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Controle de Ativos TI
          </div>
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>

          <div style={{ marginTop: '8px', marginBottom: '4px', padding: '4px 16px', fontSize: '11px', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
            Inventário
          </div>
          <NavLink to="/assets" icon={Monitor}>Ativos</NavLink>
          <NavLink to="/printers" icon={Printer}>Impressoras</NavLink>
          <NavLink to="/movements" icon={ArrowLeftRight}>Movimentações</NavLink>
          <NavLink to="/maintenances" icon={Wrench}>Manutenções</NavLink>
          <NavLink to="/reports" icon={FileBarChart}>Relatórios</NavLink>

          <div style={{ marginTop: '8px', marginBottom: '4px', padding: '4px 16px', fontSize: '11px', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
            Cadastros
          </div>
          <NavLink to="/categories" icon={Tag}>Categorias</NavLink>
          <NavLink to="/departments" icon={Building2}>Departamentos</NavLink>
          <NavLink to="/responsibles" icon={Users}>Responsáveis</NavLink>
        </nav>

        {/* Rodapé da sidebar */}
        <div style={{ padding: '16px', borderTop: '1px solid #222', fontSize: '12px', color: 'var(--gray-medium)', textAlign: 'center' }}>
          © 2025 Grupo Maxpesa
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="main-content">
        <header className="header">
          <div style={{ fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Sistema de Gestão de Ativos
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={toggleTheme}
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px' }}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--brand-red)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '14px'
            }}>
              A
            </div>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/edit/:id" element={<AssetForm />} />
            <Route path="/printers" element={<Printers />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/responsibles" element={<Responsibles />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/maintenances" element={<Maintenances />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <BrowserRouter>
      <AppLayout theme={theme} toggleTheme={toggleTheme} />
    </BrowserRouter>
  );
}

export default App;
