import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, Users, Wrench, ArrowLeftRight,
  Tag, Building2, Sun, Moon, ChevronDown, ChevronRight, Settings, FileBarChart, Printer,
  KeyRound, LogOut
} from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
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
import DevicePasswords from './pages/DevicePasswords';
import logoMaxpesa from './assets/logo_branca_maxpesa.png';
import craneFleetBg from './assets/guindaste1.jpeg';

// Link ativo na sidebar
function NavLink({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={`nav-link${isActive ? ' active' : ''}`}>
      <Icon size={16} />
      {children}
    </Link>
  );
}

// Grupo colapsável de links no menu
function NavGroup({ icon: Icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button className="nav-group-toggle" onClick={() => setOpen(o => !o)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon size={16} /> {label}
        </span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
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
  const { user, signOut } = useAuth();
  const initial = (user?.email || '?').charAt(0).toUpperCase();

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
          <div style={{ fontSize: '11px', padding: '4px 7px', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Controle de Ativos TI
          </div>
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>

          <div className="nav-section-title">
            Inventário
          </div>
          <NavLink to="/assets" icon={Monitor}>Ativos</NavLink>
          <NavLink to="/printers" icon={Printer}>Impressoras</NavLink>
          <NavLink to="/movements" icon={ArrowLeftRight}>Movimentações</NavLink>
          <NavLink to="/maintenances" icon={Wrench}>Manutenções</NavLink>
          <NavLink to="/reports" icon={FileBarChart}>Relatórios</NavLink>

          <div className="nav-section-title">
            Cadastros
          </div>
          <NavLink to="/categories" icon={Tag}>Categorias</NavLink>
          <NavLink to="/departments" icon={Building2}>Departamentos</NavLink>
          <NavLink to="/responsibles" icon={Users}>Responsáveis</NavLink>

          <div className="nav-section-title">
            Segurança
          </div>
          <NavLink to="/device-passwords" icon={KeyRound}>Senhas de Dispositivos</NavLink>
        </nav>

        {/* Rodapé da sidebar */}
        <div style={{ padding: '16px', borderTop: '1px solid #222', fontSize: '12px', color: 'var(--gray-medium)', textAlign: 'center' }}>
          © 2026 Grupo Maxpesa
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="main-content" style={{ '--page-bg-image': `url(${craneFleetBg})` }}>
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
            <div
              title={user?.email || ''}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--brand-red)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '14px'
              }}>
              {initial}
            </div>
            <button
              className="btn btn-outline"
              onClick={signOut}
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px' }}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
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
            <Route path="/device-passwords" element={<DevicePasswords />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AuthGate({ theme, toggleTheme }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--brand-black)', color: '#fff' }}>
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <AppLayout theme={theme} toggleTheme={toggleTheme} />;
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
      <AuthProvider>
        <AuthGate theme={theme} toggleTheme={toggleTheme} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
