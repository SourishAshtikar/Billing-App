import React, { useState, useEffect } from 'react';
import { billing } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BillingPerformanceChart: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState('ALL');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [totalAnnual, setTotalAnnual] = useState(0);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchData();
    }, [year, selectedProject]);

    const fetchProjects = async () => {
        try {
            // Fetch for current month just to get logic list? Or we need a proper project list endpoint.
            // Re-using overview endpoint for list is fine.
            const res = await billing.getOverview();
            setProjects(res.data.projects);
        } catch (error) {
            console.error('Error fetching projects list:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await billing.getAnnualReport(year, selectedProject);
            setData(res.data.data);
            const total = res.data.data.reduce((acc: number, curr: any) => acc + curr.cost, 0);
            setTotalAnnual(total);
        } catch (error) {
            console.error('Error fetching billing stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading billing stats...</div>;

    return (
        <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', marginTop: '2rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                        {selectedProject === 'ALL' ? 'Annual Billing Performance (All Projects)' : 'Project Annual Trend'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Total Annual Billing: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>${totalAnnual.toLocaleString()}</span></p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            </div>

            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']}
                            contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cost" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Billing Amount" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BillingPerformanceChart;
