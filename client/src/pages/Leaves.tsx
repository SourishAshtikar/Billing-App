import React, { useState, useEffect } from 'react';
import Calendar from '../components/UI/Calendar';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext.tsx';
import { leaves as leaveApi } from '../services/api.ts';

const Leaves: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const { data } = await leaveApi.getMyLeaves();
            // date from API is ISO string, Calendar expects YYYY-MM-DD
            const formattedLeaves = data.map((l: any) => new Date(l.date).toISOString().split('T')[0]);
            setLeaves(formattedLeaves);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    // Summary Stats
    const totalLeaves = leaves.length;
    // Assuming 22 working days (Standard)
    const workingDays = Math.max(0, 22 - totalLeaves);

    const handleToggleLeave = async (date: string) => {
        try {
            // Optimistic UI update
            if (leaves.includes(date)) {
                setLeaves(leaves.filter(d => d !== date));
            } else {
                setLeaves([...leaves, date]);
            }

            // Real API Call
            await leaveApi.apply({ date, reason: 'Unpaid Leave' });

            // Re-fetch to sync state (optional, or just rely on optimistic)
            // fetchLeaves(); 
        } catch (error) {
            alert('Error updating leave');
            fetchLeaves(); // Revert on error
        }
    };

    const handleSave = () => {
        alert('Changes saved automatically.');
    };

    if (loading) return <p>Loading calendar...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>My Leaves</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}</p>
                </div>
                <Button onClick={handleSave} variant="ghost">Saved Automatically</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div>
                    <Calendar leaves={leaves} onToggleLeave={handleToggleLeave} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card title="Summary">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Total Working Days</span>
                            <span style={{ fontWeight: 600 }}>22</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--danger-color)' }}>
                            <span>Unpaid Leaves</span>
                            <span style={{ fontWeight: 600 }}>-{totalLeaves}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <span>Billable Days</span>
                            <span style={{ color: 'var(--primary-color)' }}>{workingDays}</span>
                        </div>
                    </Card>

                    <Card title="Recent Activity">
                        {leaves.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No leaves marked yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', fontSize: '0.875rem' }}>
                                {leaves.slice(-5).map(date => (
                                    <li key={date} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        Marked leave for <span style={{ fontWeight: 600 }}>{date}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Leaves;
