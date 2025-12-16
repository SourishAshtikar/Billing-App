import React, { useState } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { resources } from '../../services/api';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface CSVUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await resources.bulkImport(file);
            setResult(res.data);
            if (res.data.summary.success > 0) {
                onSuccess(); // Refresh list in background
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload CSV');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Resources from CSV">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {!result ? (
                    <>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Upload a CSV file with the following columns: <strong>empId, name, email, joiningDate</strong>
                        </p>

                        <div style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer'
                                }}
                            />
                            {file ? (
                                <>
                                    <FileText size={48} color="var(--primary-color)" />
                                    <div>
                                        <p style={{ fontWeight: '600' }}>{file.name}</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload size={48} color="var(--text-secondary)" />
                                    <p style={{ color: 'var(--text-secondary)' }}>Click or drag CSV file here</p>
                                </>
                            )}
                        </div>

                        {error && <div style={{ color: 'var(--danger-color, red)', fontSize: '0.9rem' }}>{error}</div>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={!file || loading}>
                                {loading ? 'Uploading...' : 'Import'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <CheckCircle size={48} color="var(--success-color, green)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Import Completed</h3>
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem',
                            backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)'
                        }}>
                            <div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.summary.total}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Rows</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color, green)' }}>{result.summary.success}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Success</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger-color, red)' }}>{result.summary.failed}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Failed</p>
                            </div>
                        </div>

                        {result.summary.errors.length > 0 && (
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={14} /> Errors:
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--danger-color, red)' }}>
                                    {result.summary.errors.map((err: any, i: number) => (
                                        <li key={i} style={{ marginBottom: '0.25rem' }}>
                                            Row {err.row}: {err.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <Button onClick={handleClose}>Close</Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default CSVUploadModal;
