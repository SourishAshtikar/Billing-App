import React from 'react';
import { Edit, Trash2, BarChart2, X } from 'lucide-react';

interface Resource {
    id: string;
    empId: string;
    name: string;
    email: string;
    joiningDate: string;
    role: string;
}

interface ResourceActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: Resource | null;
    onEdit: (resource: Resource) => void;
    onDelete: (resource: Resource) => void;
    onAnalytics: (resource: Resource) => void;
}

const ResourceActionsModal: React.FC<ResourceActionsModalProps> = ({
    isOpen,
    onClose,
    resource,
    onEdit,
    onDelete,
    onAnalytics
}) => {
    if (!isOpen || !resource) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#ffffff', // Explicit solid white
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Stronger shadow
                position: 'relative',
                animation: 'slideUp 0.3s ease-out',
                border: '1px solid var(--border-color)'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', marginTop: 0 }}>
                    {resource.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {resource.email}
                </p>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <button
                        onClick={() => { onAnalytics(resource); onClose(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-main)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '1rem',
                            fontWeight: 500
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <div style={{
                            padding: '0.5rem', borderRadius: '50%',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'
                        }}>
                            <BarChart2 size={20} />
                        </div>
                        View Analytics
                    </button>

                    <button
                        onClick={() => { onEdit(resource); onClose(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-main)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '1rem',
                            fontWeight: 500
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <div style={{
                            padding: '0.5rem', borderRadius: '50%',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7'
                        }}>
                            <Edit size={20} />
                        </div>
                        Edit Resource
                    </button>

                    <button
                        onClick={() => { onDelete(resource); onClose(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-main)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'var(--danger-color)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger-color)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <div style={{
                            padding: '0.5rem', borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'
                        }}>
                            <Trash2 size={20} />
                        </div>
                        Delete Resource
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ResourceActionsModal;
