import React, { useState, useEffect } from 'react';
import Calendar from '../components/UI/Calendar';
import Card from '../components/UI/Card';
import { useAuth } from '../context/AuthContext.tsx';
import { leaves as leaveApi, users as userApi } from '../services/api.ts';
import ApplyLeaveModal from '../components/Leaves/ApplyLeaveModal';

const Leaves: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState<any[]>([]); // For admin selection
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);

    const [isUploading, setIsUploading] = useState(false);


    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            fetchUsers();
        } else {
            setSelectedUserId(currentUser?.id || null);
        }
    }, [currentUser]);

    useEffect(() => {
        if (selectedUserId) {
            fetchLeaves();
        }
    }, [selectedUserId]);

    const fetchUsers = async () => {
        try {
            const res = await userApi.getAll();
            const data = res.data || [];
            setAllUsers(data);
            if (data.length > 0 && !selectedUserId) {
                // Default to current user or first user if admin
                setSelectedUserId(currentUser?.id || data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchLeaves = async () => {
        if (!selectedUserId) return;
        try {
            const { data } = selectedUserId === currentUser?.id
                ? await leaveApi.getMyLeaves()
                : await leaveApi.getUserLeaves(selectedUserId);

            const formatted = data.map((l: any) => ({
                ...l,
                dateStr: new Date(l.date).toISOString().split('T')[0]
            }));
            setLeaves(formatted);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        }
    };

    const handleDateClick = async (date: string) => {
        const existing = leaves.find(l => l.dateStr === date);
        if (existing) {
            // Only admin can remove mandatory leaves
            if (existing.isMandatory && currentUser?.role !== 'ADMIN') {
                alert('Only admins can remove mandatory leaves');
                return;
            }

            if (window.confirm('Remove this leave?')) {
                try {
                    await leaveApi.delete(existing.id);
                    fetchLeaves();
                } catch (e) {
                    alert('Error removing leave');
                }
            }
        } else {
            setSelectedDate(date);
            setModalOpen(true);
        }
    };

    const handleConfirmLeave = async (date: string, isHalfDay: boolean, reason: string, isMandatory: boolean) => {
        try {
            if (isMandatory || selectedUserId !== currentUser?.id) {
                await leaveApi.adminMark({
                    userId: selectedUserId,
                    date,
                    reason,
                    isHalfDay,
                    isMandatory
                });
            } else {
                await leaveApi.apply({ date, reason, isHalfDay });
            }
            setModalOpen(false);
            fetchLeaves();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error applying leave');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const res = await leaveApi.bulkImport(file);
            alert(`Upload successful!\nSuccess: ${res.data.summary.success}\nErrors: ${res.data.summary.failed}`);
            fetchLeaves();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error uploading CSV');
        } finally {
            setIsUploading(false);
            // reset input
            event.target.value = '';
        }
    };

    // Stats Calculation
    const currentYear = 2026;
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

    // Calendar expects { dateStr, isMandatory }[]
    const leaveData = leaves.map(l => ({ dateStr: l.dateStr, isMandatory: l.isMandatory }));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Leaves</h1>
                {currentUser?.role === 'ADMIN' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ marginRight: '1rem' }}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="csv-upload"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="csv-upload"
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--primary-color)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    opacity: isUploading ? 0.7 : 1
                                }}
                            >
                                {isUploading ? 'Uploading...' : 'Bulk Upload CSV'}
                            </label>
                        </div>
                        <label className="text-sm font-medium text-gray-700">Manage Resource:</label>
                        <select
                            value={selectedUserId || ''}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div>
                    <Calendar
                        leaves={leaveData}
                        onToggleLeave={handleDateClick}
                        currentDate={viewDate}
                        onMonthChange={(offset) => {
                            const newDate = new Date(viewDate);
                            newDate.setMonth(newDate.getMonth() + offset);
                            setViewDate(newDate);
                        }}
                    />
                </div>


                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card title={`Summary (${viewDate.toLocaleString('default', { month: 'long' })})`}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {leaves.slice(0, 5).map(l => (
                                <div key={l.id} style={{ fontSize: '0.875rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 500 }}>{l.dateStr}</span>
                                        {l.isMandatory && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', fontWeight: 600 }}>MANDATORY</span>}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{l.reason || 'No reason provided'}</div>
                                </div>
                            ))}
                            {leaves.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>No leaves found</div>}
                        </div>
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
