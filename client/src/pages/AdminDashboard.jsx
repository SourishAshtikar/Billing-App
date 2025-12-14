import React, { useState, useEffect } from 'react';
import {
    Box, Container, Grid, Paper, Typography, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Select, InputLabel, FormControl, Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
    const [tab, setTab] = useState(0); // 0: Employees, 1: Projects, 2: Billing
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);

    // Project Dialog State
    const [openProjectDialog, setOpenProjectDialog] = useState(false);
    const [newProject, setNewProject] = useState({ code: '', name: '' });

    // Assign Dialog State
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [assignData, setAssignData] = useState({ projectId: '', userId: '' });

    // Employee Dialog State
    const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', hourly_rate: '', role: 'employee' });

    // ... (rest of the code)

    const [editMode, setEditMode] = useState(false);
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

    // ... (rest of the code)

    const handleCreateEmployee = async () => {
        try {
            if (editMode) {
                await api.put(`/admin/employees/${currentEmployeeId}`, newEmployee);
                alert("Employee updated successfully!");
            } else {
                await api.post('/auth/signup', newEmployee);
            }
            setOpenEmployeeDialog(false);
            setNewEmployee({ name: '', email: '', password: '', hourly_rate: '', role: 'employee', employee_id: '' });
            setEditMode(false);
            setCurrentEmployeeId(null);
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert(`Error ${editMode ? 'updating' : 'creating'} employee: ` + (err.response?.data?.message || err.message));
        }
    };

    const handleOpenNewEmployee = () => {
        setEditMode(false);
        setNewEmployee({ name: '', email: '', password: '', hourly_rate: '', role: 'employee', employee_id: '', projectId: '' });
        setOpenEmployeeDialog(true);
    };

    const handleEditClick = (emp) => {
        setEditMode(true);
        setCurrentEmployeeId(emp.id);
        const currentProjectId = emp.projects && emp.projects.length > 0 ? emp.projects[0].id : '';
        setNewEmployee({
            name: emp.name,
            email: emp.email,
            password: '', // Leave empty to keep existing
            hourly_rate: emp.hourly_rate,
            employee_id: emp.employee_id || '',
            role: 'employee',
            projectId: currentProjectId
        });
        setOpenEmployeeDialog(true);
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/employees/${id}`);
            alert("Employee deleted successfully!");
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert("Failed to delete employee: " + (err.response?.data?.message || err.message));
        }
    };

    // CSV Upload State
    const [stats, setUploadStats] = useState('');
    const fileInputRef = React.useRef(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post('/admin/upload-users', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert("Upload failed: " + (err.response?.data?.message || err.message));
        } finally {
            event.target.value = null; // Reset
        }
    };

    // ... Billing State ...
    const [billingProject, setBillingProject] = useState('');
    const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
    const [billingYear, setBillingYear] = useState(new Date().getFullYear());
    const [generatedBill, setGeneratedBill] = useState(null);
    const [pastBills, setPastBills] = useState([]);
    const [billingMessage, setBillingMessage] = useState('');

    useEffect(() => {
        fetchEmployees();
        fetchProjects();
    }, []);

    useEffect(() => {
        if (tab === 2 && billingProject) {
            fetchPastBills(billingProject);
        }
    }, [tab, billingProject]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/admin/employees');
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/admin/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPastBills = async (projectId) => {
        try {
            const res = await api.get(`/billing/project/${projectId}`);
            setPastBills(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateProject = async () => {
        try {
            await api.post('/admin/projects', newProject);
            setOpenProjectDialog(false);
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignEmployee = async () => {
        try {
            await api.post('/admin/assign', assignData);
            setOpenAssignDialog(false);
            // Optionally refresh project data if needed
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateBill = async () => {
        setBillingMessage('');
        setGeneratedBill(null);
        try {
            const res = await api.post('/billing/generate', {
                projectId: billingProject,
                month: billingMonth,
                year: billingYear
            });
            setGeneratedBill(res.data);
            setBillingMessage('Bill Generated Successfully!');
            fetchPastBills(billingProject);
        } catch (err) {
            setBillingMessage('Error generating bill: ' + (err.response?.data?.message || err.message));
        }
    };

    // Chart Data Preparation
    const chartData = {
        labels: pastBills.map(b => `${b.month}/${b.year}`),
        datasets: [
            {
                label: 'Project Billing Amount ($)',
                data: pastBills.map(b => b.total_amount),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Admin Dashboard</Typography>
                <Button variant="outlined" onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }}>Logout</Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', gap: 2 }}>
                        <Button variant={tab === 0 ? "contained" : "outlined"} onClick={() => setTab(0)}>Employees</Button>
                        <Button variant={tab === 1 ? "contained" : "outlined"} onClick={() => setTab(1)}>Projects</Button>
                        <Button variant={tab === 2 ? "contained" : "outlined"} onClick={() => setTab(2)}>Billing & Performance</Button>
                    </Paper>
                </Grid>

                {/* Employees Tab */}
                {tab === 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Employees List</Typography>
                                <Box>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        hidden
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <Button variant="outlined" onClick={() => fileInputRef.current.click()} sx={{ mr: 1 }}>
                                        Upload CSV
                                    </Button>
                                    <Button variant="contained" onClick={handleOpenNewEmployee}>New Employee</Button>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Emp ID</TableCell>
                                            <TableCell>Hourly Rate</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {employees.map((emp) => (
                                            <TableRow key={emp.id}>
                                                <TableCell>{emp.id}</TableCell>
                                                <TableCell>{emp.name}</TableCell>
                                                <TableCell>{emp.email}</TableCell>
                                                <TableCell>{emp.employee_id || '-'}</TableCell>
                                                <TableCell>${emp.hourly_rate}</TableCell>
                                                <TableCell>
                                                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditClick(emp)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteEmployee(emp.id)} sx={{ ml: 1 }}>
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                )}

                {/* ... Projects Tab ... */}
                {tab === 1 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Projects List</Typography>
                                <Box>
                                    <Button variant="contained" onClick={() => setOpenProjectDialog(true)} sx={{ mr: 1 }}>New Project</Button>
                                    <Button variant="outlined" onClick={() => setOpenAssignDialog(true)}>Assign Employee</Button>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Code</TableCell>
                                            <TableCell>Name</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {projects.map((proj) => (
                                            <TableRow key={proj.id}>
                                                <TableCell>{proj.id}</TableCell>
                                                <TableCell>{proj.code}</TableCell>
                                                <TableCell>{proj.name}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                )}

                {/* ... Billing Tab ... */}
                {tab === 2 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Billing & Performance</Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Select Project</InputLabel>
                                    <Select
                                        value={billingProject}
                                        label="Select Project"
                                        onChange={(e) => setBillingProject(e.target.value)}
                                    >
                                        {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Month" type="number"
                                    value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)}
                                    inputProps={{ min: 1, max: 12 }} sx={{ width: 100 }}
                                />
                                <TextField
                                    label="Year" type="number"
                                    value={billingYear} onChange={(e) => setBillingYear(e.target.value)}
                                    sx={{ width: 100 }}
                                />

                                <Button variant="contained" onClick={handleGenerateBill} disabled={!billingProject}>
                                    Generate Bill
                                </Button>
                            </Box>

                            {billingMessage && <Alert severity={billingMessage.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{billingMessage}</Alert>}

                            {generatedBill && (
                                <Box sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Bill Details (Total: ${generatedBill.total_amount})</Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Employee</TableCell>
                                                    <TableCell>Rate</TableCell>
                                                    <TableCell>Total Days</TableCell>
                                                    <TableCell>Weekends</TableCell>
                                                    <TableCell>Leaves</TableCell>
                                                    <TableCell>Working Days</TableCell>
                                                    <TableCell>Amount</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {generatedBill.details.map((d, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{d.userName}</TableCell>
                                                        <TableCell>${d.hourlyRate}/hr</TableCell>
                                                        <TableCell>{d.totalDays}</TableCell>
                                                        <TableCell>{d.weekends}</TableCell>
                                                        <TableCell>{d.leaves}</TableCell>
                                                        <TableCell>{d.workingDays}</TableCell>
                                                        <TableCell>${d.amount}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Performance History</Typography>
                                    {pastBills.length > 0 ? (
                                        <Bar options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Monthly Billing Trend' } } }} data={chartData} />
                                    ) : (
                                        <Typography color="text.secondary">Select a project to view performance history.</Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Past Bills Log</Typography>
                                    {pastBills.map((bill) => (
                                        <Accordion key={bill.id}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography>{bill.month}/{bill.year} - ${bill.total_amount}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>User</TableCell>
                                                                <TableCell>Amount</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {bill.details.map((d, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell>{d.userName}</TableCell>
                                                                    <TableCell>${d.amount}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Create Project Dialog */}
            <Dialog open={openProjectDialog} onClose={() => setOpenProjectDialog(false)}>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Project Code" fullWidth
                        value={newProject.code} onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                    />
                    <TextField
                        margin="dense" label="Project Name" fullWidth
                        value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProjectDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateProject}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* Assign Employee Dialog */}
            <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
                <DialogTitle>Assign Employee to Project</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Project</InputLabel>
                        <Select
                            value={assignData.projectId}
                            label="Project"
                            onChange={(e) => setAssignData({ ...assignData, projectId: e.target.value })}
                        >
                            {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Employee</InputLabel>
                        <Select
                            value={assignData.userId}
                            label="Employee"
                            onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                        >
                            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
                    <Button onClick={handleAssignEmployee}>Assign</Button>
                </DialogActions>
            </Dialog>

            {/* Create/Edit Employee Dialog */}
            <Dialog open={openEmployeeDialog} onClose={() => setOpenEmployeeDialog(false)}>
                <DialogTitle>{editMode ? 'Edit Employee' : 'Register New Employee'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Name" fullWidth
                        value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    />
                    <TextField
                        margin="dense" label="Employee ID" fullWidth
                        value={newEmployee.employee_id} onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                    />
                    <TextField
                        margin="dense" label="Email" fullWidth type="email"
                        value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    />
                    <TextField
                        margin="dense" label={editMode ? "Password (leave blank to keep)" : "Password"} fullWidth type="password"
                        value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    />
                    <TextField
                        margin="dense" label="Hourly Rate" fullWidth type="number"
                        value={newEmployee.hourly_rate} onChange={(e) => setNewEmployee({ ...newEmployee, hourly_rate: e.target.value })}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Assign Project</InputLabel>
                        <Select
                            value={newEmployee.projectId || ''}
                            label="Assign Project"
                            onChange={(e) => setNewEmployee({ ...newEmployee, projectId: e.target.value })}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEmployeeDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateEmployee}>{editMode ? 'Update' : 'Register'}</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminDashboard;
