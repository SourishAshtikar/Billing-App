import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import { Download } from 'lucide-react';
import Button from '../components/UI/Button';
import { billing as billingApi, projects as projectApi } from '../services/api.ts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BillingReports: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [filteredReports, setFilteredReports] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    // Filters
    const [employeeOptions, setEmployeeOptions] = useState<string[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]); // Empty means ALL

    // Helper for Currency
    const getSymbol = (currency: string) => {
        switch (currency) {
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            default: return '$';
        }
    };

    // Initial Fetch (Projects)
    useEffect(() => {
        projectApi.getAll().then(({ data }) => {
            setProjects(data);
        });
    }, []);

    // Fetch Report
    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const period = selectedMonth === 'ALL' ? 'YTD' : 'MONTH';
                const monthToSend = selectedMonth === 'ALL' ? now.getMonth() : selectedMonth;

                // @ts-ignore
                const { data } = await billingApi.getProjectStats(
                    selectedProject,
                    monthToSend,
                    selectedYear,
                    period
                );

                const resources = data.resources || [];
                setReports(resources);

                // Extract unique employees for filter
                const employees = Array.from(new Set(resources.map((r: any) => r.resourceName))).sort() as string[];
                setEmployeeOptions(employees);
                // Keep selected employees if they still exist in new data

            } catch (error) {
                console.error('Error fetching billing report', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [selectedProject, selectedMonth, selectedYear]);

    // Client-side Filter Effect
    useEffect(() => {
        if (selectedEmployees.length === 0) {
            setFilteredReports(reports);
        } else {
            setFilteredReports(reports.filter(r => selectedEmployees.includes(r.resourceName)));
        }
    }, [selectedEmployees, reports]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const projectName = selectedProject === 'ALL' ? 'All Projects' : projects.find(p => p.id === selectedProject)?.name || 'Project';
        const periodText = selectedMonth === 'ALL' ? 'YTD' : new Date(selectedYear, selectedMonth as number).toLocaleString('default', { month: 'long' });
        // Include Year in the title
        const year = selectedYear;
        const titleText = selectedMonth === 'ALL' ? `YTD Report - ${year}` : `${periodText} ${year}`;

        doc.setFontSize(18);
        doc.text(`Billing Report - ${projectName} (${titleText})`, 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Sr.No", "Resource Name", "Project", "PO", "Line Item", "Expected", "Leaves", "Actual", "Cumulative", "Rate", "Billing Amount"];
        const tableRows: any[] = [];

        filteredReports.forEach((item, index) => {
            const symbol = getSymbol(item.currency || 'USD');
            const row = [
                index + 1,
                item.resourceName,
                item.projectName || '-',
                item.po || '-',
                item.lineItem || '-',
                item.expectedWorkingDays || 0,
                item.leavesTaken || 0,
                item.actualWorkingDays || 0,
                item.cumulativeWorkingDays || 0,
                `${symbol}${item.rate}`,
                `${symbol}${Number(item.cost).toLocaleString()}`
            ];
            tableRows.push(row);
        });

        // Add Totals Row
        const totalExpected = filteredReports.reduce((sum, item) => sum + (item.expectedWorkingDays || 0), 0);
        const totalLeaves = filteredReports.reduce((sum, item) => sum + (item.leavesTaken || 0), 0);
        const totalActual = filteredReports.reduce((sum, item) => sum + (item.actualWorkingDays || 0), 0);
        const totalCost = filteredReports.reduce((sum, item) => sum + Number(item.cost || 0), 0);
        const symbol = getSymbol(filteredReports[0]?.currency || 'USD');

        tableRows.push([
            "", "Total", "", "", "",
            totalExpected,
            totalLeaves,
            totalActual,
            "-",
            "-",
            `${symbol}${totalCost.toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`Billing_Report_${projectName.replace(/\s+/g, '_')}_${titleText.replace(/\s+/g, '_')}.pdf`);
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Billing & Reports</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontWeight: 500 }}
                        >
                            <option value="ALL">All Months (YTD)</option>
                            {months.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontWeight: 500 }}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '200px' }}
                        >
                            <option value="ALL">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <Button variant="secondary" onClick={handleExportPDF}>
                            <Download size={18} /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                    {/* Left Sidebar: Filters */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {employeeOptions.length > 0 && (
                            <Card className="p-4">
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Select Employees:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.25rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployees.length === 0}
                                            onChange={() => setSelectedEmployees([])}
                                        />
                                        <span style={{ fontWeight: selectedEmployees.length === 0 ? 600 : 400 }}>All Employees</span>
                                    </label>
                                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }}></div>
                                    {employeeOptions.map(emp => (
                                        <label key={emp} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.25rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(emp)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEmployees([...selectedEmployees, emp]);
                                                    } else {
                                                        setSelectedEmployees(selectedEmployees.filter(item => item !== emp));
                                                    }
                                                }}
                                            />
                                            {emp}
                                        </label>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Content: Table */}
                    <Card title={`Billing Details (${selectedMonth === 'ALL' ? 'YTD ' + selectedYear : months[selectedMonth as number] + ' ' + selectedYear})`}>
                        {loading ? <p>Loading report...</p> : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sr.No</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resource Name</th>
                                            {selectedProject === 'ALL' && <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Project</th>}
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PO</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Line Item</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Expected</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Leaves</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Actual</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Cumulative</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Rate</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Billing Amt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReports.length === 0 ? (
                                            <tr><td colSpan={11} style={{ padding: '1rem', textAlign: 'center' }}>No billing data matches your filters.</td></tr>
                                        ) : (
                                            <>
                                                {filteredReports.map((item, idx) => {
                                                    const symbol = getSymbol(item.currency || 'USD');
                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{idx + 1}</td>
                                                            <td style={{ padding: '0.75rem', fontWeight: 500, fontSize: '0.875rem' }}>{item.resourceName}</td>
                                                            {selectedProject === 'ALL' && <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{item.projectName}</td>}
                                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{item.po || '-'}</td>
                                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{item.lineItem || '-'}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>{item.expectedWorkingDays || 0}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--danger-color)' }}>{item.leavesTaken || 0}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>{item.actualWorkingDays || 0}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>{item.cumulativeWorkingDays || 0}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>{symbol}{item.rate}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>{symbol}{Number(item.cost).toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {/* Totals Row */}
                                                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid var(--border-color)' }}>
                                                    <td colSpan={selectedProject === 'ALL' ? 5 : 4} style={{ padding: '0.75rem', textAlign: 'right' }}>Total:</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{filteredReports.reduce((sum, item) => sum + (item.expectedWorkingDays || 0), 0)}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--danger-color)' }}>{filteredReports.reduce((sum, item) => sum + (item.leavesTaken || 0), 0)}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{filteredReports.reduce((sum, item) => sum + (item.actualWorkingDays || 0), 0)}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>-</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>-</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                        {getSymbol(filteredReports[0]?.currency || 'USD')}
                                                        {filteredReports.reduce((sum, item) => sum + Number(item.cost || 0), 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BillingReports;
