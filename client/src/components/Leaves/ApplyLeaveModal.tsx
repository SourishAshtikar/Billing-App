import React, { useState } from 'react';
import Button from '../UI/Button';

interface ApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string | null;
    onConfirm: (date: string, isHalfDay: boolean) => void;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, date, onConfirm }) => {
    const [isHalfDay, setIsHalfDay] = useState(false);

    if (!isOpen || !date) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(date, isHalfDay);
        // Reset and close handled by parent usually, but resetting state here is good
        setIsHalfDay(false);
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Apply Leave</h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Applying leave for <strong>{date}</strong>
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="halfDay"
                            checked={isHalfDay}
                            onChange={(e) => setIsHalfDay(e.target.checked)}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="halfDay" style={{ cursor: 'pointer', fontWeight: 500 }}>Half Day Leave</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Confirm Leave
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
