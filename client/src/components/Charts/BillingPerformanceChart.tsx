import React, { useState, useEffect } from 'react';
import { billing } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const BillingPerformanceChart: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState('ALL');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(2026);
    const [totalAnnual, setTotalAnnual] = useState(0);
    const [totalExpected, setTotalExpected] = useState(0);
    const [poTotal, setPoTotal] = useState(0); // PO Limit
    const [currencySymbol, setCurrencySymbol] = useState('$');

    // Helper to get symbol from code (simple map or just use code)
    const getSymbol = (curr: string) => {
        switch (curr) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            case 'AUD': return 'A$';
            case 'CAD': return 'C$';
            default: return curr || '$';
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchData();
    }, [year, selectedProject]);

    const fetchProjects = async () => {
        try {
            // Fetch for current month just to get logic list? Or we need a proper project list endpoint.
            // Re-using overview endpoint for list is fine.
            const res = await billing.getOverview();
            setProjects(res.data.projects);
        } catch (error) {
            console.error('Error fetching projects list:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await billing.getAnnualReport(year, selectedProject);
            setData(res.data.data);
            const total = res.data.data.reduce((acc: number, curr: any) => acc + curr.cost, 0);
            const expected = res.data.data.reduce((acc: number, curr: any) => acc + (curr.expectedCost || 0), 0);
            setTotalAnnual(total);
            setTotalExpected(expected);
            const po = res.data.poTotal || 0;
            setPoTotal(po);

            // Set Currency
            if (res.data.currency) {
                setCurrencySymbol(getSymbol(res.data.currency));
            } else if (selectedProject !== 'ALL') {
                const proj = projects.find(p => p.id === selectedProject);
                setCurrencySymbol(getSymbol(proj?.currency || 'USD'));
            } else {
                setCurrencySymbol('$');
            }

            // Calculate Monthly Data with Capped Expected & Cumulative for Trend
            let runningExpectedTotal = 0;
            let cumulativeExpectedForTrend = 0;

            const chartData = res.data.data.map((item: any) => {
                const rawExpected = item.expectedCost || 0;
                let displayExpected = rawExpected;

                // If PO exists, ensure we don't project more than PO in total for Monthly Display
                if (po > 0) {
                    const available = Math.max(0, po - runningExpectedTotal);
                    displayExpected = Math.min(rawExpected, available);
                    runningExpectedTotal += displayExpected;
                }

                // Cumulative Trend Logic (Projecting when PO is achieved)
                // We use the raw or capped expected? Usually Trend implies projection based on expectation.
                // Let's use the capped running total to align with the monthly bars
                cumulativeExpectedForTrend += displayExpected;

                return {
                    ...item,
                    cost: item.cost, // Monthly Actual
                    expectedCost: displayExpected, // Monthly Expected
                    cumulativeExpectedForTrend // Cumulative Trend
                };
            });
            setData(chartData);
        } catch (error) {
            console.error('Error fetching billing stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading billing stats...</div>;

    return (
        <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', marginTop: '2rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                        {selectedProject === 'ALL' ? 'Annual Billing Performance (All Projects)' : 'Project Annual Trend & PO Projection'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Total Actual: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{currencySymbol}{totalAnnual.toLocaleString()}</span>
                        {' | '}
                        Total Expected: <span style={{ color: '#82ca9d', fontWeight: 'bold' }}>{currencySymbol}{totalExpected.toLocaleString()}</span>
                        {poTotal > 0 && (
                            <>
                                {' | '}
                                PO Limit: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{currencySymbol}{poTotal.toLocaleString()}</span>
                            </>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '200px' }}
                    >
                        <option value="ALL">All Projects</option>
                        {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                    >
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                    </select>
                </div>
            </div>

            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
                        {/* Left Axis: Monthly */}
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                        {/* Right Axis: Cumulative */}
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />

                        <Tooltip
                            formatter={(value, name) => [`${currencySymbol}${Number(value).toLocaleString()}`, name]}
                            contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        />
                        <Legend />

                        <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#166534" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Monthly Actual" />
                        <Line yAxisId="left" type="monotone" dataKey="expectedCost" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Monthly Expected" />

                        {poTotal > 0 && selectedProject !== 'ALL' && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumulativeExpectedForTrend"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                                name="Cumulative Trend (PO Projection)"
                            />
                        )}

                        {poTotal > 0 && (
                            <ReferenceLine
                                yAxisId="right"
                                y={poTotal}
                                label={{ value: 'PO Limit', position: 'insideTopRight', fill: '#ef4444', fontSize: 12 }}
                                stroke="#ef4444"
                                strokeDasharray="3 3"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BillingPerformanceChart;
