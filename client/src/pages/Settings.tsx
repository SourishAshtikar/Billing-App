import React, { useState } from 'react';
import { auth } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const Settings: React.FC = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.newPassword !== formData.confirmNewPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            await auth.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password' });
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Settings</h1>

            <div style={{ maxWidth: '600px' }}>
                <Card title="Change Password">
                    {message && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#b91c1c'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Current Password</label>
                            <input
                                type="password"
                                required
                                value={formData.currentPassword}
                                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Password</label>
                            <input
                                type="password"
                                required
                                value={formData.newPassword}
                                onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={formData.confirmNewPassword}
                                onChange={e => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button type="submit">Update Password</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
