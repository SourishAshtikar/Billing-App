import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
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
    const [assignedDays, setAssignedDays] = useState(0);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

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
                startDate
            });
            // Refresh list
            fetchData();
            setSelectedResourceId('');
        } catch (error) {
            alert('Failed to assign resource');
        }
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
                        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Execute Assignment</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <select
                                value={selectedResourceId}
                                onChange={(e) => setSelectedResourceId(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                            >
                                <option value="">Select Resource</option>
                                {allResources.filter(r => r.role === 'RESOURCE').map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    title="Assignment Start Date"
                                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '130px' }}
                                />
                                <input
                                    type="number"
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                    placeholder="Rate"
                                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '80px' }}
                                />
                                <input
                                    type="number"
                                    value={assignedDays}
                                    onChange={(e) => setAssignedDays(Number(e.target.value))}
                                    placeholder="Days"
                                    title="Assigned Billable Days"
                                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '70px' }}
                                />
                                <select
                                    value={rateType}
                                    onChange={(e) => setRateType(e.target.value)}
                                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flex: 1 }}
                                >
                                    <option value="HOURLY">Hourly</option>
                                    <option value="DAILY">Daily</option>
                                </select>
                                <Button size="sm" onClick={handleAssign} disabled={!selectedResourceId}>Assign</Button>
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
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                ${ar.rate}/{ar.rateType === 'DAILY' ? 'day' : 'hr'} • {ar.assignedDays || 0} days • {ar.startDate ? new Date(ar.startDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveResource(ar.userId)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color, #ef4444)' }}
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
