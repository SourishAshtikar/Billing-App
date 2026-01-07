import React, { useState, useEffect } from 'react';
import { resources } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResourceWorkingDaysChartProps {
    resourceId: string;
}



import LeaveDetailsModal from './LeaveDetailsModal';

const ResourceWorkingDaysChart: React.FC<ResourceWorkingDaysChartProps> = ({ resourceId }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false); // State for modal

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

    // Filter leaves for the modal
    const currentMonthLeaves = data.dailyBreakdown?.filter((d: any) => d.status === 'LEAVE' || d.status === 'HALF_DAY') || [];

    // Prepare chart data for Pie Chart
    const chartData = [
        { name: 'Working Days', value: data?.monthlyStats?.workedDays || 0, color: '#10b981' }, // Green
        { name: 'Leave Days', value: data?.monthlyStats?.leaveDays || 0, color: '#ef4444' } // Red
    ];

    return (
        <div style={{ padding: '0 2rem 2rem' }}>
            {/* Leave Details Modal */}
            <LeaveDetailsModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                leaves={currentMonthLeaves}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Monthly Breakdown</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            >
                                <option value={2026}>2026</option>
                                <option value={2025}>2025</option>
                                <option value={2024}>2024</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Monthly Stats */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Current Month Stats</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Days</span>
                                <span style={{ fontWeight: 600 }}>{data?.monthlyStats?.totalDays || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Business Days (Available)</span>
                                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{data?.monthlyStats?.businessDays || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Actual Worked</span>
                                <span style={{ fontWeight: 600, color: '#10b981' }}>{data?.monthlyStats?.workedDays || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Leaves</span>
                                <span
                                    onClick={() => setIsLeaveModalOpen(true)}
                                    style={{
                                        fontWeight: 600,
                                        color: '#3b82f6', // Make it look clickable (blue)
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                    title="Click to view details"
                                >
                                    {data?.monthlyStats?.leaveDays || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Annual Stats */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Annual Overview</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Annually Allocated</span>
                                <span style={{ fontWeight: 600 }}>{data?.annualStats?.allocated || 0} days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Annual Exhausted (YTD)</span>
                                <span style={{ fontWeight: 600, color: '#f59e0b' }}>{data?.annualStats?.exhausted || 0} days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Applied Leaves</span>
                                <span style={{ fontWeight: 600, color: '#3b82f6' }}>{data?.annualStats?.totalApplied || 0} days</span>
                            </div>
                            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Remained Annual</span>
                                <span style={{ fontWeight: 600, color: (data?.annualStats?.remained || 0) < 0 ? '#ef4444' : '#10b981' }}>
                                    {data?.annualStats?.remained || 0} days
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceWorkingDaysChart;
