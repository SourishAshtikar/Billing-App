import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, BarChart2, Users, Calendar, Download } from 'lucide-react';
import axios from 'axios';
import XLSX from 'xlsx-js-style';
import { useAuth } from '../context/AuthContext';

const RtoCompliance = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'attendance' | 'dashboard'>('dashboard');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [summary, setSummary] = useState<any>(null);

    // Dashboard States
    const [analyticsData, setAnalyticsData] = useState<any[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchAnalytics();
        }
    }, [activeTab, filterMonth, filterYear, filterLocation]);

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/rto/analytics', {
                params: { month: filterMonth, year: filterYear, location: filterLocation === 'All' ? undefined : filterLocation },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleExport = () => {
        // Create header row
        const headers = [
            'Employee ID',
            'Employee Name',
            'Location',
            'Project Code',
            'Project Name',
            'RM SAP ID',
            'RM Name',
            'Total Days Present',
            'Week 1',
            'Week 2',
            'Week 3',
            'Week 4',
            'Status'
        ];

        // Create data rows with styles
        const dataRows = analyticsData.map(row => {
            const week1 = row.weeklyCompliance[0];
            const week2 = row.weeklyCompliance[1];
            const week3 = row.weeklyCompliance[2];
            const week4 = row.weeklyCompliance[3];

            // Helper for cell style
            const getStatusStyle = (isCompliant: boolean) => ({
                fill: { fgColor: { rgb: isCompliant ? "C6F6D5" : "FED7D7" } }, // Light Green / Light Red
                font: { color: { rgb: isCompliant ? "22543D" : "822727" }, bold: true },
                alignment: { horizontal: "center" }
            });

            const getCountStyle = (count: number, threshold: number) => ({
                font: { color: { rgb: count >= threshold ? "22c55e" : "ef4444" }, bold: true },
                alignment: { horizontal: "center" }
            });

            return [
                { v: row.empId, t: 's' },
                { v: row.name, t: 's' },
                { v: row.location, t: 's' },
                { v: row.projectCode || '-', t: 's' },
                { v: row.projectName || '-', t: 's' },
                { v: row.rmSapId || '-', t: 's' },
                { v: row.rmName || '-', t: 's' },
                { v: row.daysPresent, t: 'n', s: getCountStyle(row.daysPresent, 12) },
                {
                    v: week1 ? week1.present : '-',
                    t: week1 ? 'n' : 's',
                    s: week1 ? getStatusStyle(week1.compliant) : {}
                },
                {
                    v: week2 ? week2.present : '-',
                    t: week2 ? 'n' : 's',
                    s: week2 ? getStatusStyle(week2.compliant) : {}
                },
                {
                    v: week3 ? week3.present : '-',
                    t: week3 ? 'n' : 's',
                    s: week3 ? getStatusStyle(week3.compliant) : {}
                },
                {
                    v: week4 ? week4.present : '-',
                    t: week4 ? 'n' : 's',
                    s: week4 ? getStatusStyle(week4.compliant) : {}
                },
                {
                    v: row.compliant ? "Compliant" : "Non-Compliant",
                    t: 's',
                    s: getStatusStyle(row.compliant)
                }
            ];
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // ID
            { wch: 25 }, // Name
            { wch: 15 }, // Location
            { wch: 15 }, // Project Code
            { wch: 25 }, // Project Name
            { wch: 15 }, // RM SAP ID
            { wch: 25 }, // RM Name
            { wch: 15 }, // Total
            { wch: 15 }, // W1
            { wch: 15 }, // W2
            { wch: 15 }, // W3
            { wch: 15 }, // W4
            { wch: 15 }  // Status
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RTO Compliance");

        const monthName = new Date(0, filterMonth).toLocaleString('default', { month: 'long' });
        XLSX.writeFile(wb, `RTO_Compliance_${monthName}_${filterYear}.xlsx`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setMessage(null);
            setSummary(null);
        }
    };

    const handleUpload = async (type: 'users' | 'attendance') => {
        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file first.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        const url = type === 'users' ? '/api/rto/upload' : '/api/rto/upload-attendance';

        setUploading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token} `
                }
            });

            setMessage({ type: 'success', text: response.data.message });
            setSummary(response.data.summary);
            setFile(null);
            // Reset inputs
            const inputId = type === 'users' ? 'user-csv-upload' : 'attendance-csv-upload';
            const fileInput = document.getElementById(inputId) as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error uploading file.'
            });
        } finally {
            setUploading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const locations = ['All', ...Array.from(new Set(analyticsData.map(d => d.location).filter(Boolean)))];

    return (
        <div style={{ padding: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                RTO Compliance Tracker
            </h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <TabButton id="dashboard" label="Dashboard" icon={BarChart2} />
                <TabButton id="attendance" label="Upload Attendance" icon={Calendar} />
                <TabButton id="users" label="Upload User Data" icon={Users} />
            </div>

            {activeTab === 'dashboard' && (
                <div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(parseInt(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button
                            onClick={handleExport}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                marginLeft: 'auto',
                                fontWeight: 500
                            }}
                        >
                            <Download size={18} /> Export to Excel
                        </button>
                    </div>

                    {loadingAnalytics ? (
                        <div>Loading analytics...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--card-bg)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Employee</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Location</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Total Days</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Week 1</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Week 2</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Week 3</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Week 4</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.map((row) => (
                                        <tr key={row.empId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.5rem' }}>
                                                <div style={{ fontWeight: 600 }}>{row.name}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{row.empId}</div>
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>{row.location}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        backgroundColor: row.daysPresent >= 12 ? '#22c55e' : '#ef4444',
                                                        boxShadow: `0 0 6px ${row.daysPresent >= 12 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`,
                                                        marginRight: '0.4rem'
                                                    }} />
                                                    <span style={{ fontWeight: 600, color: row.daysPresent >= 12 ? '#22c55e' : '#ef4444' }}>
                                                        {row.daysPresent}
                                                    </span>
                                                </div>
                                            </td>
                                            {row.weeklyCompliance.map((week: any, idx: number) => (
                                                <td key={idx} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '0.15rem'
                                                    }}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: week.compliant ? '#22c55e' : '#ef4444',
                                                            opacity: 0.8
                                                        }} />
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                            {week.present}
                                                        </span>
                                                    </div>
                                                </td>
                                            ))}
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                {row.compliant ? (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '15px',
                                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                        border: '1px solid rgba(34, 197, 94, 0.2)'
                                                    }}>
                                                        <div style={{
                                                            width: '10px',
                                                            height: '10px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#22c55e',
                                                            boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                                                            border: '1px solid white'
                                                        }} />
                                                        <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.8rem' }}>Compliant</span>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '15px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)'
                                                    }}>
                                                        <div style={{
                                                            width: '10px',
                                                            height: '10px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#ef4444',
                                                            boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)',
                                                            border: '1px solid white'
                                                        }} />
                                                        <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.8rem' }}>Non-Compliant</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {(activeTab === 'users' || activeTab === 'attendance') && (
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    maxWidth: '600px'
                }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {activeTab === 'users' ? <Users size={20} /> : <Calendar size={20} />}
                        {activeTab === 'users' ? 'Upload User Data' : 'Upload Attendance Data'}
                    </h2>

                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {activeTab === 'users'
                            ? 'Upload CSV with: Employee ID, Employee Name, Work Location, Project Code, Project name, RM SAP ID, RM name'
                            : 'Upload CSV with Attendance Data (Dynamic Date Headers)'}
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="file"
                            id={activeTab === 'users' ? 'user-csv-upload' : 'attendance-csv-upload'}
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor={activeTab === 'users' ? 'user-csv-upload' : 'attendance-csv-upload'}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '2rem',
                                cursor: 'pointer',
                                backgroundColor: file ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Upload size={32} style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }} />
                            <span style={{ fontWeight: 500 }}>
                                {file ? file.name : 'Click to select CSV file'}
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={() => handleUpload(activeTab)}
                        disabled={!file || uploading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: !file || uploading ? 'var(--input-bg)' : 'var(--primary-color)',
                            color: !file || uploading ? 'var(--text-secondary)' : 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: !file || uploading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {uploading ? 'Uploading...' : 'Upload Data'}
                    </button>

                    {message && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#22c55e' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </div>
                    )}

                    {summary && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload Summary</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>{summary.processed || summary.success}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Processed</div>
                                </div>
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{summary.errors?.length || summary.failed || 0}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Failed</div>
                                </div>
                                <div style={{ padding: '0.5rem', backgroundColor: 'var(--input-bg)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{summary.totalRows || summary.total}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total</div>
                                </div>
                            </div>
                            {summary.errors && summary.errors.length > 0 && (
                                <div style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Errors:</h4>
                                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.8rem', color: '#ef4444' }}>
                                        {summary.errors.map((err: any, idx: number) => (
                                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                                Row {err.row}: {err.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RtoCompliance;
