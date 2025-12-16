import React, { useState, useEffect } from 'react';
import { billing } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BillingPerformanceChart: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState('ALL');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [grandTotal, setGrandTotal] = useState(0);

    useEffect(() => {
        fetchData();
        fetchProjects();
    }, [month, year, selectedProject]);

    const fetchProjects = async () => {
        try {
            const res = await billing.getOverview(month, year);
            setProjects(res.data.projects);
        } catch (error) {
            console.error('Error fetching projects list:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (selectedProject === 'ALL') {
                const res = await billing.getOverview(month, year);
                setData(res.data.projects);
                setGrandTotal(res.data.grandTotal);
            } else {
                const res = await billing.getProjectStats(selectedProject, month, year);
                setData(res.data.resources.map((r: any) => ({
                    code: r.resourceName, // Reuse 'code' key for XAxis
                    cost: r.cost
                })));
                setGrandTotal(res.data.totalCost);
            }
        } catch (error) {
            console.error('Error fetching billing stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading billing stats...</div>;

    return (
        <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                        {selectedProject === 'ALL' ? 'Billing Performance Overview' : 'Project Resource Breakdown'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Total Projected Billing: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>${grandTotal.toLocaleString()}</span></p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '200px' }}
                    >
                        <option value="ALL">All Projects</option>
                        {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            </div>

            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="code" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="cost" fill="#8884d8" name="Projected Cost" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BillingPerformanceChart;
