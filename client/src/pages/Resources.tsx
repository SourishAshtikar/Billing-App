import React, { useState, useEffect } from 'react';
import { Plus, User, Edit, Trash2, Upload, BarChart2 } from 'lucide-react';
import { resources } from '../services/api';
import ResourceEditModal from '../components/Resources/ResourceEditModal';
import CSVUploadModal from '../components/Resources/CSVUploadModal';
import ResourceAnalyticsModal from '../components/Resources/ResourceAnalyticsModal';

interface Resource {
    id: string;
    empId: string;
    name: string;
    email: string;
    joiningDate: string;
    role: string;
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

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {resourceList.map((resource) => (
                    <div key={resource.id}
                        onClick={() => handleAnalyticsClick(resource)}
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: '600' }}>{resource.name}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{resource.role}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAnalyticsClick(resource); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                                    title="Analytics"
                                >
                                    <BarChart2 size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(resource); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(resource.id, resource.name); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color, #ef4444)' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <p><strong>Email:</strong> {resource.email}</p>
                            {resource.empId && <p><strong>Emp ID:</strong> {resource.empId}</p>}
                            {resource.joiningDate && <p><strong>Joined:</strong> {new Date(resource.joiningDate).toLocaleDateString()}</p>}
                        </div>
                    </div>
                ))}
            </div>

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
