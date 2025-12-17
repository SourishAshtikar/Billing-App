import React, { useState, useEffect } from 'react';
import { Plus, User, Edit, Trash2, Upload, BarChart2 } from 'lucide-react';
import { resources } from '../services/api';
import ResourceEditModal from '../components/Resources/ResourceEditModal';
import CSVUploadModal from '../components/Resources/CSVUploadModal';
import ResourceAnalyticsModal from '../components/Resources/ResourceAnalyticsModal';
import Card from '../components/UI/Card';

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
    const [resourceList, setResourceList] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
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

    const handleEditClick = (resource: Resource) => {
        setSelectedResource(resource);
        setIsEditModalOpen(true);
    };

    const handleAnalyticsClick = (resource: Resource) => {
        setSelectedResource(resource);
        setIsAnalyticsModalOpen(true);
    };

    const handleDeleteClick = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This will remove all their project assignments and leave records.`)) {
            try {
                await resources.delete(id);
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
            </div>

            {/* List Table */}
            <Card className="overflow-hidden">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Name</th>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Allocated Days (Project)</th>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Leaves Taken (YTD)</th>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Available Working Days</th>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resourceList.map((resource) => (
                                <tr key={resource.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{resource.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{resource.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{resource.allocatedDays || 0}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{resource.leavesTaken || 0}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                                        {resource.availableWorkingDays || 0}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleAnalyticsClick(resource)}
                                                style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary-color)' }}
                                                title="Analytics"
                                            >
                                                <BarChart2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(resource)}
                                                style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(resource.id, resource.name)}
                                                style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger-color)' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

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
