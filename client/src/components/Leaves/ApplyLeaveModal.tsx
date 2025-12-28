import React, { useState } from 'react';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

interface ApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string | null;
    onConfirm: (date: string, isHalfDay: boolean, reason: string, isMandatory: boolean) => void;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, date, onConfirm }) => {
    const { user } = useAuth();
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [isMandatory, setIsMandatory] = useState(false);
    const [reason, setReason] = useState('');

    if (!isOpen || !date) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(date, isHalfDay, reason || (isHalfDay ? 'Half Day' : 'Full Day'), isMandatory);
        // Reset state
        setIsHalfDay(false);
        setIsMandatory(false);
        setReason('');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{user?.role === 'ADMIN' ? 'Mark Leave' : 'Apply Leave'}</h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    {user?.role === 'ADMIN' ? 'Marking leave' : 'Applying leave'} for <strong>{date}</strong>
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={isHalfDay ? 'Half Day' : 'Full Day'}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="halfDay"
                            checked={isHalfDay}
                            onChange={(e) => setIsHalfDay(e.target.checked)}
                            style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="halfDay" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>Half Day Leave</label>
                    </div>

                    {user?.role === 'ADMIN' && (
                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="mandatory"
                                checked={isMandatory}
                                onChange={(e) => setIsMandatory(e.target.checked)}
                                style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                            />
                            <label htmlFor="mandatory" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', color: 'var(--danger-color)' }}>Mandatory Leave (Admin Only)</label>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={onClose} size="sm">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm">
                            {user?.role === 'ADMIN' ? 'Mark Leave' : 'Confirm Leave'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;

