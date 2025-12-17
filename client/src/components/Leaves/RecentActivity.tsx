
import React from 'react';

interface Leave {
    dateStr: string;
    isHalfDay: boolean;
    date: string | Date;
}

interface RecentActivityProps {
    leaves: Leave[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ leaves }) => {
    // Sort descending
    const sortedLeaves = [...leaves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {sortedLeaves.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No recent activity.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sortedLeaves.map((l) => (
                        <div key={l.dateStr} style={{
                            padding: '0.75rem 0.5rem', // Compact padding
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.875rem' // Compact font
                        }}>
                            <span style={{ fontWeight: 600 }}>{l.dateStr}</span>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: l.isHalfDay ? '#fff7ed' : '#fee2e2',
                                color: l.isHalfDay ? '#c2410c' : '#ef4444',
                                fontWeight: 500
                            }}>
                                {l.isHalfDay ? 'HALF DAY' : 'FULL DAY'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentActivity;
