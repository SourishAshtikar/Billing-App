import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
    role?: 'ADMIN' | 'MANAGER' | 'RESOURCE'; // In real app, get from Context
}

const Layout: React.FC<LayoutProps> = ({ role = 'ADMIN' }) => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar role={role} />
            <main style={{
                marginLeft: '260px',
                padding: '2rem',
                width: '100%',
                minHeight: '100vh',
                backgroundColor: 'var(--bg-color)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
