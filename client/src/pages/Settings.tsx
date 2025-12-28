import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Lock, Shield } from 'lucide-react';
import { auth, users as usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'RESOURCE';
    empId?: string;
}

const Settings: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    // User management state
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [currentUser]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await usersApi.getAll();
            setAllUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            await usersApi.updateRole(userId, newRole);
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            setMessage({ type: 'success', text: 'User role updated successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error updating role' });
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            await auth.changePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error updating password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            {message && (
                <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Security">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 mb-4 text-gray-700">
                            <Lock size={20} />
                            <h3 className="font-semibold">Change Password</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" isLoading={loading}>
                                Update Password
                            </Button>
                        </div>
                    </form>
                </Card>

                {currentUser?.role === 'ADMIN' && (
                    <Card title="User Management">
                        <div className="flex items-center gap-2 mb-4 text-gray-700">
                            <Shield size={20} />
                            <h3 className="font-semibold">Manage Roles</h3>
                        </div>

                        {loadingUsers ? (
                            <div className="text-center py-4">Loading users...</div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto max-h-[400px]">
                                {allUsers.map(u => (
                                    <div key={u.id} className="flex flex-col p-3 border border-gray-100 rounded-md bg-gray-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-sm">{u.name}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                                <p className="text-xs text-gray-400">ID: {u.empId || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    disabled={updatingUserId === u.id || u.id === currentUser.id}
                                                    className="text-xs p-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="MANAGER">MANAGER</option>
                                                    <option value="RESOURCE">RESOURCE</option>
                                                </select>
                                            </div>
                                        </div>
                                        {u.id === currentUser.id && (
                                            <p className="text-[10px] text-indigo-600 font-medium">Cannot change your own role</p>
                                        )}
                                        {updatingUserId === u.id && (
                                            <p className="text-[10px] text-gray-500 italic">Updating...</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Settings;
