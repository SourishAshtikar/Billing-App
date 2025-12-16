import React from 'react';
import Card from '../components/UI/Card';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <Card title="Total Projects">
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>12</p>
                    <p style={{ color: 'var(--text-secondary)' }}>3 Active this month</p>
                </Card>

                <Card title="Resource Utilization">
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>87%</p>
                    <p style={{ color: 'var(--text-secondary)' }}>+5% from last month</p>
                </Card>

                <Card title="Pending Leaves">
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>4</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Requires approval</p>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
