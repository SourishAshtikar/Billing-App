import React, { useState, useEffect } from 'react';
import { resources } from '../../services/api';
import Card from '../UI/Card';

interface ResourceMonthlyTableProps {
    onResourceClick?: (resourceId: string) => void;
}

const ResourceMonthlyTable: React.FC<ResourceMonthlyTableProps> = ({ onResourceClick }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, [year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await resources.getAnnualBreakdown(year);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching annual breakdown:', error);
        } finally {
            setLoading(false);
        }
    };

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    if (loading) return <div style={{ padding: '1rem' }}>Loading breakdown...</div>;

    return (
        <div style={{ marginTop: '0rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Monthly Working Days ({year})</h2>
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                </select>
            </div>

            <Card className="overflow-hidden">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>Resource Name</th>
                                {months.map(m => (
                                    <th key={m} style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center' }}>{m}</th>
                                ))}
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#f0fdf4' }}>Worked YTD</th>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#eff6ff' }}>Remaining</th>
                                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#f1f5f9' }}>Yearly Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500, position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5 }}>
                                        <span
                                            onClick={() => onResourceClick && onResourceClick(item.id)}
                                            style={{
                                                cursor: onResourceClick ? 'pointer' : 'default',
                                                color: onResourceClick ? 'var(--primary-color)' : 'inherit',
                                                textDecoration: onResourceClick ? 'underline' : 'none',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {item.name}
                                        </span>
                                    </td>
                                    {months.map((_, index) => {
                                        const monthData = item.monthlyBreakdown[index];
                                        const workingDays = monthData?.workingDays || 0;
                                        return (
                                            <td key={index} style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{workingDays}</span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>/{monthData?.businessDays}</span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0fdf4', color: '#15803d' }}>
                                        {item.workedYTD?.toFixed(1) || '0.0'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                                        {item.remainingDays?.toFixed(1) || '0.0'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                        {(item.totalAssigned || 0).toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ResourceMonthlyTable;
