import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWeekend } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    leaves: string[]; // Array of date strings 'YYYY-MM-DD'
    onToggleLeave: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ leaves, onToggleLeave }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calculate empty cells for start of month
    const startDay = startOfMonth(currentMonth).getDay();
    const emptyCells = Array(startDay).fill(null);

    return (
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy')}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handlePrevMonth} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent' }}><ChevronLeft size={20} /></button>
                    <button onClick={handleNextMonth} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent' }}><ChevronRight size={20} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                {weekDays.map(day => (
                    <div key={day} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{day}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {emptyCells.map((_, i) => <div key={`empty-${i}`} />)}

                {daysInMonth.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isLeave = leaves.includes(dateStr);
                    const isWknd = isWeekend(date);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onToggleLeave(dateStr)}
                            disabled={isWknd} // Optional: Disable weekends if they aren't working days
                            style={{
                                padding: '1rem 0',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: isLeave ? 'var(--danger-color)' : isWknd ? '#f1f5f9' : 'transparent',
                                color: isLeave ? 'white' : isWknd ? '#94a3b8' : 'var(--text-main)',
                                cursor: isWknd ? 'not-allowed' : 'pointer',
                                fontWeight: isLeave ? 600 : 400,
                                position: 'relative',
                                transition: 'all 0.1s'
                            }}
                        >
                            {format(date, 'd')}
                            {isLeave && (
                                <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: '0.625rem' }}>LEAVE</div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: 'var(--danger-color)', borderRadius: 2 }}></div> Unpaid Leave
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: '#f1f5f9', borderRadius: 2 }}></div> Weekend
                </div>
            </div>
        </div>
    );
};

export default Calendar;
