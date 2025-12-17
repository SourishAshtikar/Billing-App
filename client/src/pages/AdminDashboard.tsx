import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/UI/Card';
import { projects as projectApi, resources as resourceApi } from '../services/api.ts';
import { Folder, Users } from 'lucide-react';
import BillingPerformanceChart from '../components/Charts/BillingPerformanceChart';

const AdminDashboard: React.FC = () => {
    // const { user } = useAuth(); // Unused
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        totalResources: 0 // Mock for now or need api
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: projects } = await projectApi.getAll();
                const { data: resources } = await resourceApi.getAll();
                setStats({
                    totalProjects: projects.length,
                    activeProjects: projects.filter((p: any) => p.status === 'ACTIVE').length,
                    totalResources: resources.length
                });
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Welcome back, Admin</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Link to="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '50%', color: 'var(--primary-color)' }}>
                                <Folder size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Projects</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalProjects}</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link to="/resources" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#f3e8ff', borderRadius: '50%', color: '#7e22ce' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Resources</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalResources}</p>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>



            <BillingPerformanceChart />
        </div>
    );
};

export default AdminDashboard;
