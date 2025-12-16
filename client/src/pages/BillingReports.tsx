import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import { Download, TrendingUp, DollarSign, Filter } from 'lucide-react';
import Button from '../components/UI/Button';
import { billing as billingApi, projects as projectApi } from '../services/api.ts';

const BillingReports: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);

    // Initial Fetch (Projects)
    useEffect(() => {
        projectApi.getAll().then(({ data }) => {
            setProjects(data);
            if (data.length > 0) setSelectedProject(data[0].id);
        });
    }, []);

    // Fetch Report when Project Changes
    useEffect(() => {
        if (!selectedProject) return;

        const fetchReport = async () => {
            setLoading(true);
            try {
                // Fetch current month report
                const now = new Date();
                const { data } = await billingApi.getReport(selectedProject, now.getMonth() + 1, now.getFullYear());
                setReports(data.resources || []);
                setTotalRevenue(data.totalProjectAmount || 0);
            } catch (error) {
                console.error('Error fetching billing report', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [selectedProject]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Billing & Reports</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    <Button variant="secondary">
                        <Download size={18} /> Export PDF
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <Card title="Current Month Breakdown">
                    {loading ? <p>Loading report...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Resource</th>
                                    <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Billable Days</th>
                                    <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>No billing data found.</td></tr>
                                ) : reports.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem 0.75rem', fontWeight: 500 }}>{item.resourceName}</td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                                            {item.params.billableDays} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({item.params.leaveCount} leaves)</span>
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>${Number(item.total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '50%', color: '#166534' }}>
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Revenue (Current)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '50%', color: 'var(--primary-color)' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg. Utilization</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>--</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BillingReports;
