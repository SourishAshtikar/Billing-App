import React, { useState, useEffect } from 'react';
import Calendar from '../components/UI/Calendar';
import Card from '../components/UI/Card';
import { useAuth } from '../context/AuthContext.tsx';
import { leaves as leaveApi } from '../services/api.ts';
import ApplyLeaveModal from '../components/Leaves/ApplyLeaveModal';
import RecentActivity from '../components/Leaves/RecentActivity';

const Leaves: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]); // Store full leave objects
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const fetchLeaves = async () => {
        try {
            const { data } = await leaveApi.getMyLeaves();
            // Store full objects, but we need date string for Calendar
            const formatted = data.map((l: any) => ({
                ...l,
                dateStr: new Date(l.date).toISOString().split('T')[0]
            }));
            setLeaves(formatted);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const [viewDate, setViewDate] = useState(new Date());

    // ... existing fetchLeaves ...

    // Stats Calculation
    const currentYear = new Date().getFullYear();
    const currentMonthLeaves = leaves.filter(l => {
        const d = new Date(l.date);
        return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });

    const currentYearLeaves = leaves.filter(l => new Date(l.date).getFullYear() === currentYear);

    const monthLeavesCount = currentMonthLeaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);
    const yearLeavesCount = currentYearLeaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);

    // Calculate Business Days
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
        new Date(viewDate.getFullYear(), viewDate.getMonth(), 1),
        new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
    );

    const yearBusinessDays = getBusinessDays(
        new Date(currentYear, 0, 1),
        new Date(currentYear, 11, 31)
    );

    const monthBillableDays = Math.max(0, monthBusinessDays - monthLeavesCount);
    const annualBillableDays = Math.max(0, yearBusinessDays - yearLeavesCount);

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const handleDateClick = async (date: string) => {
        const existing = leaves.find(l => l.dateStr === date);
        if (existing) {
            // Remove leave
            if (window.confirm('Remove this leave?')) {
                try {
                    await leaveApi.apply({ date });
                    fetchLeaves();
                } catch (e) {
                    alert('Error removing leave');
                }
            }
        } else {
            // Open Modal
            setSelectedDate(date);
            setModalOpen(true);
        }
    };

    const handleConfirmLeave = async (date: string, isHalfDay: boolean) => {
        try {
            await leaveApi.apply({ date, reason: isHalfDay ? 'Half Day' : 'Full Day', isHalfDay });
            setModalOpen(false);
            fetchLeaves();
        } catch (error) {
            alert('Error applying leave');
        }
    };
    // Calendar expects string[]
    const leaveDates = leaves.map(l => l.dateStr);

    return (
        <div>
            {/* Header ... */}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div>
                    <Calendar
                        leaves={leaveDates}
                        onToggleLeave={handleDateClick}
                        currentDate={viewDate}
                        onMonthChange={handleMonthChange}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card title={`Summary(${viewDate.toLocaleString('default', { month: 'long' })})`}>
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
                    </Card>

                    <Card title="Recent Activity">
                        <RecentActivity leaves={leaves} />
                    </Card>
                </div>
            </div>

            <ApplyLeaveModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                date={selectedDate}
                onConfirm={handleConfirmLeave}
            />
        </div>
    );
};

export default Leaves;
