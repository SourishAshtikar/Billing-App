import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import { resources } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ResourceEditModal from '../components/Resources/ResourceEditModal';
import CSVUploadModal from '../components/Resources/CSVUploadModal';
import ResourceAnalyticsModal from '../components/Resources/ResourceAnalyticsModal';
import ResourceMonthlyTable from '../components/Resources/ResourceMonthlyTable';
import ResourceActionsModal from '../components/Resources/ResourceActionsModal';

interface Resource {
    id: string;
    empId: string;
    name: string;
    email: string;
    joiningDate: string;
    role: string;
    allocatedDays?: number;
    leavesTaken?: number;
    availableWorkingDays?: string | number;
}

const Resources: React.FC = () => {
    const { user } = useAuth();
    const [resourceList, setResourceList] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [formData, setFormData] = useState({
        empId: '',
        name: '',
        email: '',
        joiningDate: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await resources.getAll();
            setResourceList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await resources.create(formData);
            setIsAddModalOpen(false);
            setFormData({ empId: '', name: '', email: '', joiningDate: '' });
            fetchResources(); // Refresh list
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error creating resource');
        }
    };

    const handleResourceClick = (resourceId: string) => {
        const resource = resourceList.find(r => r.id === resourceId);
        if (resource) {
            setSelectedResource(resource);
            setIsActionsModalOpen(true);
        }
    };

    const handleEditClick = (resource: Resource) => {
        setSelectedResource(resource);
        setIsEditModalOpen(true);
    };

    const handleAnalyticsClick = (resource: Resource) => {
        setSelectedResource(resource);
        setIsAnalyticsModalOpen(true);
    };

    const handleDeleteClick = async (resource: Resource) => {
        if (window.confirm(`Are you sure you want to delete ${resource.name}? This will remove all their project assignments and leave records.`)) {
            try {
                await resources.delete(resource.id);
                fetchResources();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to delete resource');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Resources</h1>
                {user?.role === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setIsCSVModalOpen(true)}
                            style={{
                                backgroundColor: 'transparent',
                                color: 'var(--primary-color)',
                                border: '1px solid var(--primary-color)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            <Upload size={20} /> Import CSV
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            style={{
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            <Plus size={20} /> Add Resource
                        </button>
                    </div>
                )}
            </div>

            {/* Monthly Breakdown Table */}
            <ResourceMonthlyTable onResourceClick={handleResourceClick} />

            {/* Add Modal */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '500px',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New Resource</h2>

                        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                                <input
                                    type="text" name="name" required
                                    value={formData.name} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email ID</label>
                                <input
                                    type="email" name="email" required
                                    value={formData.email} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>EMP ID</label>
                                    <input
                                        type="text" name="empId" required
                                        value={formData.empId} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date of Joining</label>
                                    <input
                                        type="date" name="joiningDate" required
                                        value={formData.joiningDate} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}
                                >
                                    Add Resource
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Actions Modal (The new generic popup) */}
            <ResourceActionsModal
                isOpen={isActionsModalOpen}
                onClose={() => setIsActionsModalOpen(false)}
                resource={selectedResource}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onAnalytics={handleAnalyticsClick}
                role={user?.role}
            />

            {/* Edit Modal */}
            <ResourceEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                resource={selectedResource}
                onSuccess={fetchResources}
            />

            {/* CSV Upload Modal */}
            <CSVUploadModal
                isOpen={isCSVModalOpen}
                onClose={() => setIsCSVModalOpen(false)}
                onSuccess={fetchResources}
            />

            {/* Analytics Modal */}
            <ResourceAnalyticsModal
                isOpen={isAnalyticsModalOpen}
                onClose={() => setIsAnalyticsModalOpen(false)}
                resource={selectedResource}
            />
        </div>
    );
};

export default Resources;
