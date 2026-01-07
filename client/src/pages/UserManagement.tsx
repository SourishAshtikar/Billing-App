import React, { useEffect, useState } from 'react';
import { users as userApi } from '../services/api';
import Card from '../components/UI/Card';
import { UserPlus, User, Edit2 } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { useAuth } from '../context/AuthContext';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    empId?: string;
    joiningDate?: string;
    createdAt: string;
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'RESOURCE',
        empId: '',
        joiningDate: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            const { data } = await userApi.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'RESOURCE',
            empId: '',
            joiningDate: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: UserData) => {
        setIsEditing(true);
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Password is not updated here for security
            role: user.role,
            empId: user.empId || '',
            joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing && selectedUser) {
                // Remove password from payload if empty
                const { password, ...updateData } = formData;
                await userApi.update(selectedUser.id, updateData);
                alert('User updated successfully');
            } else {
                await userApi.create(formData);
                alert('User onboarded successfully');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'onboard'} user`);
        } finally {
            setSubmitting(false);
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    if (loading) return <p>Loading users...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>User Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage application users and roles</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleOpenAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <UserPlus size={20} /> Onboard New User
                    </button>
                )}
            </div>

            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem' }}>User</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Employee ID</th>
                                <th style={{ padding: '1rem' }}>Joined</th>
                                <th style={{ padding: '1rem' }}>Created</th>
                                {isAdmin && <th style={{ padding: '1rem' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{u.name}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            backgroundColor: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'MANAGER' ? '#fef3c7' : u.role === 'ADMIN_VIEWER' ? '#e0e7ff' : '#dcfce7',
                                            color: u.role === 'ADMIN' ? '#991b1b' : u.role === 'MANAGER' ? '#92400e' : u.role === 'ADMIN_VIEWER' ? '#3730a3' : '#166534'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.empId || '-'}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    {isAdmin && (
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleOpenEditModal(u)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--primary-color)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                <Edit2 size={16} /> Edit
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? "Edit User" : "Onboard New User"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                    {!isEditing && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Initial Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                                style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                            >
                                <option value="RESOURCE">Resource</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN_VIEWER">Admin Viewer</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Employee ID (Optional)</label>
                            <input
                                type="text"
                                value={formData.empId}
                                onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                                placeholder="EMP001"
                                style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Joining Date (Optional)</label>
                        <input
                            type="date"
                            value={formData.joiningDate}
                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                            style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            {submitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update User' : 'Create User')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
