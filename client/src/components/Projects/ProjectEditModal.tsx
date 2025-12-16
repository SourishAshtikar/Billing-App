import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { projects } from '../../services/api';

interface ProjectEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    onSuccess: () => void;
}

const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ isOpen, onClose, project, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                code: project.code || '',
                description: project.description || '',
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                status: project.status || 'ACTIVE'
            });
        }
    }, [project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await projects.update(project.id, formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project Code</label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '80px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Button onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectEditModal;
