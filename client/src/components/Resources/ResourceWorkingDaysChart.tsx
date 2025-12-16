import React, { useState, useEffect } from 'react';
import { resources } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResourceWorkingDaysChartProps {
    resourceId: string;
}

const COLORS = ['#0088FE', '#FF8042'];

const ResourceWorkingDaysChart: React.FC<ResourceWorkingDaysChartProps> = ({ resourceId }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (resourceId) {
            fetchData();
        }
    }, [resourceId, month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await resources.getWorkingDays(resourceId, month, year);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching working days:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading chart...</div>;
    if (!data) return <div>No data available</div>;

    const chartData = [
        { name: 'Exhausted Days', value: data.actualWorkingDays },
        { name: 'Remaining Assigned', value: Math.max(0, (data.totalAssignedDays || 0) - data.actualWorkingDays) },
        { name: 'Leave Days', value: data.leaveDays },
    ];

    return (
        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: '600' }}>Working Days Overview</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            </div>

            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                <p>Total Business Days: <strong>{data.totalBusinessDays}</strong></p>
                <p>Total Assigned Days: <strong>{data.totalAssignedDays || 0}</strong></p>
                <p>Exhausted (Worked): <strong>{data.actualWorkingDays}</strong></p>
                <p>Working Ratio: <strong>{data.workingRatio.toFixed(1)}%</strong></p>
            </div>
        </div>
    );
};

export default ResourceWorkingDaysChart;
