import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import type { Project } from '../types';
import { Plus, Folder, Edit, Trash2, Users } from 'lucide-react';
import { projects as projectApi } from '../services/api.ts';

import ManageResourcesModal from '../components/Projects/ManageResourcesModal';
import ProjectEditModal from '../components/Projects/ProjectEditModal';

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<{ id: string, name: string } | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data } = await projectApi.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await projectApi.create({ ...formData });
            setShowModal(false);
            setFormData({ code: '', name: '', description: '', startDate: new Date().toISOString().split('T')[0] });
            fetchProjects(); // Refresh list
        } catch (error) {
            alert('Error creating project');
        }
    };

    const openResourceModal = (project: Project) => {
        setSelectedProject({ id: project.id, name: project.name });
        setShowResourceModal(true);
    };

    const handleEditClick = (project: Project) => {
        setProjectToEdit(project);
        setShowEditModal(true);
    };

    const handleDeleteClick = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete project ${name}? This action cannot be undone.`)) {
            try {
                await projectApi.delete(id);
                fetchProjects();
            } catch (error) {
                alert('Failed to delete project');
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Projects</h1>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={20} /> New Project
                </Button>
            </div>

            {loading ? <p>Loading projects...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {projects.map((project) => (
                        <Card key={project.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                                    <Folder size={18} /> {project.code}
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '999px',
                                    backgroundColor: project.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                    color: project.status === 'ACTIVE' ? '#166534' : '#64748b',
                                    fontWeight: 600
                                }}>
                                    {project.status}
                                </span>
                                {project._count?.resources !== undefined && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        backgroundColor: '#e0e7ff',
                                        color: 'var(--primary-color)',
                                        fontWeight: 600
                                    }}>
                                        <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {project._count.resources} Resources
                                    </span>
                                )}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{project.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                {project.description}
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" onClick={() => openResourceModal(project)}>Manage Resources</Button>
                                <button
                                    onClick={() => handleEditClick(project)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(project.id, project.name)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color, #ef4444)' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </Card>
                    ))}
                    {projects.length === 0 && <p>No projects found. Create one!</p>}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
                <form onSubmit={handleCreate}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Project Code</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. PRJ-004"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Project Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Project Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Start Date</label>
                        <input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Create Project</Button>
                    </div>
                </form>
            </Modal>

            {selectedProject && (
                <ManageResourcesModal
                    isOpen={showResourceModal}
                    onClose={() => setShowResourceModal(false)}
                    projectId={selectedProject.id}
                    projectName={selectedProject.name}
                />
            )}

            {projectToEdit && (
                <ProjectEditModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    project={projectToEdit}
                    onSuccess={fetchProjects}
                />
            )}
        </div>
    );
};

export default Projects;
