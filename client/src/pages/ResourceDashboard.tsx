import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import { useAuth } from '../context/AuthContext.tsx';
import { leaves as leaveApi } from '../services/api.ts';
import { Calendar as CalendarIcon, User, Briefcase, Clock } from 'lucide-react';

const ResourceDashboard: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();

    const fetchLeavesAndStats = async () => {
        try {
            const { data: leavesData } = await leaveApi.getMyLeaves();
            const formatted = leavesData.map((l: any) => ({
                ...l,
                dateStr: new Date(l.date).toISOString().split('T')[0]
            }));
            setLeaves(formatted);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeavesAndStats();
    }, []);

    if (loading) return <p>Loading dashboard...</p>;

    // Local Stats Calculation (Matches Leaves.tsx logic)
    const currentYear = now.getFullYear();
    const currentMonthLeaves = leaves.filter(l => {
        const d = new Date(l.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const currentYearLeaves = leaves.filter(l => new Date(l.date).getFullYear() === currentYear);

    const monthLeavesCount = currentMonthLeaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);
    const yearLeavesCount = currentYearLeaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);

    // Stats Calculation
    const getBusinessDays = (start: Date, end: Date) => {
        let count = 0;
        let cur = new Date(start);
        while (cur <= end) {
            const day = cur.getDay();
            if (day !== 0 && day !== 6) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    const monthBusinessDays = getBusinessDays(
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
    );

    const yearBusinessDays = getBusinessDays(
        new Date(currentYear, 0, 1),
        new Date(currentYear, 11, 31)
    );

    const monthBillableDays = Math.max(0, monthBusinessDays - monthLeavesCount);
    const annualBillableDays = Math.max(0, yearBusinessDays - yearLeavesCount);

    // Filter upcoming leaves
    const todayStr = now.toISOString().split('T')[0];
    const upcomingLeaves = leaves
        .filter(l => l.dateStr >= todayStr)
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
        .slice(0, 5);

    return (
        <div style={{ padding: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Employee Details Tile */}
                <Card title="Employee Details">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color-light, #eef2ff)', borderRadius: '50%', color: 'var(--primary-color)' }}>
                                <User size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Name</p>
                                <p style={{ fontWeight: 600 }}>{user?.name}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '50%', color: '#10b981' }}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Employee ID</p>
                                <p style={{ fontWeight: 600 }}>{user?.empId || 'N/A'}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '50%', color: '#f59e0b' }}>
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Joining Date</p>
                                <p style={{ fontWeight: 600 }}>{user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Summary Tile */}
                <Card title={`Attendance Summary (${now.toLocaleString('default', { month: 'long' })})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <span>Annual Working Days</span>
                            <span style={{ fontWeight: 600 }}>{annualBillableDays}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--danger-color)' }}>
                            <span>Annual Leaves</span>
                            <span style={{ fontWeight: 600 }}>{yearLeavesCount}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Month Working Days</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{monthBillableDays}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)' }}>
                            <span>Month Leaves</span>
                            <span style={{ fontWeight: 600 }}>{monthLeavesCount}</span>
                        </div>
                    </div>
                </Card>

                {/* Upcoming Leaves Tile */}
                <Card title="Upcoming Leaves">
                    {upcomingLeaves.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                            <p>No upcoming leaves scheduled.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
                            {upcomingLeaves.map((leave, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: 'var(--radius-sm)',
                                    borderLeft: `4px solid ${leave.isHalfDay ? '#f59e0b' : '#3b82f6'}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Clock size={16} color="var(--text-secondary)" />
                                        <span>{new Date(leave.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '12px',
                                        backgroundColor: leave.isHalfDay ? '#fff7ed' : '#eff6ff',
                                        color: leave.isHalfDay ? '#9a3412' : '#1e40af'
                                    }}>
                                        {leave.isHalfDay ? 'Half Day' : 'Full Day'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ResourceDashboard;
