import React, { useState, useEffect } from 'react';
import { Trash2, Edit } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { resources as resourceApi, projects as projectApi } from '../../services/api';

interface ManageResourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    projectName: string;
}

const ManageResourcesModal: React.FC<ManageResourcesModalProps> = ({ isOpen, onClose, projectId, projectName }) => {
    const [assignedResources, setAssignedResources] = useState<any[]>([]);
    const [allResources, setAllResources] = useState<any[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [rateType, setRateType] = useState('HOURLY');
    const [rate, setRate] = useState(50);
    const [currency, setCurrency] = useState('USD');
    const [assignedDays, setAssignedDays] = useState(0);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchData();
        }
    }, [isOpen, projectId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch project details to get assigned resources
            const projectRes = await projectApi.getById(projectId!);
            setAssignedResources(projectRes.data.resources || []);

            // Fetch all resources for the dropdown
            const resourcesRes = await resourceApi.getAll();
            setAllResources(resourcesRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedResourceId || !projectId) return;
        try {
            await resourceApi.assign({
                projectId,
                userId: selectedResourceId,
                rate,
                rateType,
                assignedDays,
                startDate,
                currency
            });
            // Refresh list
            fetchData();
            setSelectedResourceId('');
            setRate(50);
            setAssignedDays(0);
            setIsEditing(false);
        } catch (error) {
            alert('Failed to assign/update resource');
        }
    };

    const handleEditClick = (ar: any) => {
        setSelectedResourceId(ar.userId);
        setRate(Number(ar.rate));
        setRateType(ar.rateType);
        setCurrency(ar.currency || 'USD');
        setAssignedDays(ar.assignedDays || 0);
        setStartDate(ar.startDate ? new Date(ar.startDate).toISOString().split('T')[0] : '');
        setIsEditing(true);
    };

    const handleRemoveResource = async (userId: string) => {
        if (!projectId) return;
        if (window.confirm('Are you sure you want to remove this resource from the project?')) {
            try {
                await projectApi.removeResource(projectId, userId);
                fetchData();
            } catch (error) {
                alert('Failed to remove resource');
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Resources: ${projectName}`}>
            {loading ? <p>Loading...</p> : (
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>{isEditing ? 'Edit Assignment' : 'New Assignment'}</h4>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.4rem',
                            backgroundColor: '#f9fafb',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <select
                                value={selectedResourceId}
                                onChange={(e) => setSelectedResourceId(e.target.value)}
                                disabled={isEditing}
                                style={{
                                    flex: '1 1 100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="">Select Resource</option>
                                {allResources.filter((r: any) => r.role === 'RESOURCE').map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Assignment Start Date"
                                style={{
                                    flex: '1 1 120px',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                placeholder="Rate"
                                style={{
                                    width: '60px',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                style={{
                                    width: '65px',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="USD">USD</option>
                                <option value="INR">INR</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                            <input
                                type="number"
                                value={assignedDays}
                                onChange={(e) => setAssignedDays(Number(e.target.value))}
                                placeholder="Days"
                                title="Assigned Billable Days"
                                style={{
                                    width: '55px',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <select
                                value={rateType}
                                onChange={(e) => setRateType(e.target.value)}
                                style={{
                                    flex: '1 1 80px',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="HOURLY">Hourly</option>
                                <option value="DAILY">Daily</option>
                            </select>

                            <div style={{ display: 'flex', gap: '0.4rem', flex: '1 1 100%', marginTop: '0.25rem' }}>
                                <Button size="sm" onClick={handleAssign} disabled={!selectedResourceId} style={{ flex: 1 }}>
                                    {isEditing ? 'Update Assignment' : 'Assign Resource'}
                                </Button>
                                {isEditing && (
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        setIsEditing(false);
                                        setSelectedResourceId('');
                                    }}>Cancel</Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Assigned Resources</h4>
                        {assignedResources.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No resources assigned.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {assignedResources.map((ar: any) => (
                                    <li key={ar.id} style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>{ar.user?.name || 'Unknown User'}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                {ar.currency || '$'}{ar.rate}/{ar.rateType === 'DAILY' ? 'd' : 'h'} • {ar.assignedDays || 0}d
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                    onClick={() => handleEditClick(ar)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                    title="Edit"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveResource(ar.userId)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color, #ef4444)' }}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ManageResourcesModal;
