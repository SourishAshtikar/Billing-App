import React from 'react';
import { X } from 'lucide-react';

interface LeaveDetail {
    date: string;
    status: string; // 'LEAVE' or 'HALF_DAY'
    reason: string;
    isMandatory: boolean;
}

interface LeaveDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaves: LeaveDetail[];
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({ isOpen, onClose, leaves }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, // Higher than analytics modal
            backdropFilter: 'blur(2px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '600px',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out',
                maxHeight: '80vh',
                overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <X size={20} />
                </button>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    Leave Details (Current Month)
                </h3>

                {leaves.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                        No leaves recorded for this month.
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Date</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Type</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Reason</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((leave, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem' }}>{leave.date}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                                            backgroundColor: leave.status === 'LEAVE' ? '#fee2e2' : '#fef3c7',
                                            color: leave.status === 'LEAVE' ? '#dc2626' : '#d97706',
                                            fontWeight: 600
                                        }}>
                                            {leave.status === 'LEAVE' ? 'Full Day' : 'Half Day'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{leave.reason || '-'}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {leave.isMandatory ? (
                                            <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.8rem' }}>Mandatory</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Applied</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default LeaveDetailsModal;
