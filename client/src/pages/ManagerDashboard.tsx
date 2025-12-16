import React from 'react';
import Card from '../components/UI/Card';

const ManagerDashboard: React.FC = () => {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Manager Dashboard</h1>
            <Card title="Team Overview">
                <p>Welcome to the Manager View. Here you can track team utilization and project status.</p>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                    (Reporting features to be implemented: View-only access to Project Billing)
                </p>
            </Card>
        </div>
    );
};

export default ManagerDashboard;
