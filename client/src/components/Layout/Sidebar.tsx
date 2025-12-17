import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, CreditCard, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    role: 'ADMIN' | 'MANAGER' | 'RESOURCE';
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
    const { logout } = useAuth();
    const linkStyle = ({ isActive }: { isActive: boolean }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        color: isActive ? 'white' : 'var(--sidebar-text)',
        backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.5rem',
        transition: 'all 0.2s',
        opacity: isActive ? 1 : 0.7,
    });

    return (
        <aside style={{
            width: '260px',
            height: '100vh',
            backgroundColor: 'var(--sidebar-bg)',
            color: 'white',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed'
        }}>
            <div style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-color)' }}></div>
                HCLTech.
            </div>

            <nav style={{ flex: 1 }}>
                {/* Common Dashboard */}
                <NavLink to="/dashboard" style={linkStyle}>
                    <Home size={20} /> Dashboard
                </NavLink>

                {role === 'RESOURCE' && (
                    <NavLink to="/leaves" style={linkStyle}>
                        <Calendar size={20} /> My Leaves
                    </NavLink>
                )}

                {role === 'ADMIN' && (
                    <>
                        <NavLink to="/projects" style={linkStyle}>
                            <Users size={20} /> Projects
                        </NavLink>
                        <NavLink to="/resources" style={linkStyle}>
                            <Users size={20} /> Resources
                        </NavLink>
                        <NavLink to="/reports" style={linkStyle}>
                            <CreditCard size={20} /> Billing & Reports
                        </NavLink>
                    </>
                )}

                {role === 'MANAGER' && (
                    <>
                        <NavLink to="/team-billing" style={linkStyle}>
                            <CreditCard size={20} /> Team Reports
                        </NavLink>
                    </>
                )}

                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                    <NavLink to="/settings" style={linkStyle}>
                        <Settings size={20} /> Settings
                    </NavLink>
                </div>
            </nav>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <button
                    onClick={logout}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--sidebar-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        width: '100%',
                        textAlign: 'left'
                    }}>
                    <LogOut size={20} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
