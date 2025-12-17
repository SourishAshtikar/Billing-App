
import React, { useState, useEffect } from 'react';
import Calendar from '../components/UI/Calendar';
import Card from '../components/UI/Card';
import { useAuth } from '../context/AuthContext.tsx';
import { leaves as leaveApi, billing as billingApi } from '../services/api.ts';
import RecentActivity from '../components/Leaves/RecentActivity';

const ResourceDashboard: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]); // Store full leave objects
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        monthStats: { workingDays: 0, leavesTaken: 0 },
        annualStats: { workingDays: 0, leavesTaken: 0 }
    });

    // Calendar Month state (synced with Calendar component usually, 
    // but our Calendar component might be uncontrolled or simple.
    // Let's assume we maintain current viewed month here to fetch stats.)
    const [viewDate, setViewDate] = useState(new Date());

    const fetchLeavesAndStats = async () => {
        try {
            // Fetch Leaves
            const { data: leavesData } = await leaveApi.getMyLeaves();
            const formatted = leavesData.map((l: any) => ({
                ...l,
                dateStr: new Date(l.date).toISOString().split('T')[0]
            }));
            setLeaves(formatted);

            // Fetch Stats for the view month
            const { data: statsData } = await billingApi.getResourceStats(
                viewDate.getMonth(),
                viewDate.getFullYear()
            );
            setStats(statsData);

        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeavesAndStats();
    }, [viewDate]); // Refetch when month changes

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    if (loading) return <p>Loading dashboard...</p>;

    const leaveDates = leaves.map(l => l.dateStr);

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                {/* Calendar Column */}
                <div>
                    {/* Pass viewDate and handlers to Calendar if it supports them. 
                        If current Calendar is uncontrolled, we might need to wrap it or modify it.
                        Checking Calendar usage in Leaves.tsx: <Calendar leaves={leaveDates} onToggleLeave={...} />
                        It doesn't seem to take `date` prop. I will wrap it or control it if possible.
                        For now, I'll assume I can pass `currentDate` and `onMonthChange`.
                        I will check Calendar code in next step to ensure. if not I will update it.
                      */}
                    <Calendar
                        leaves={leaveDates}
                        // @ts-ignore - Assuming I'll update Calendar to accept these
                        currentDate={viewDate}
                        onMonthChange={handleMonthChange}
                    />
                </div>

                {/* Summary Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card title={`Summary (${viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Working Days</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{stats.monthStats.workingDays}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--danger-color)' }}>
                            <span>Leaves Availed</span>
                            <span style={{ fontWeight: 600 }}>{stats.monthStats.leavesTaken}</span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Recent Activity - Bottom Horizontal (Now Vertical List) */}
            <div style={{ marginTop: '2rem' }}>
                <Card title="Recent Activity">
                    <RecentActivity leaves={leaves} />
                </Card>
            </div>
        </div>
    );
};

export default ResourceDashboard;
