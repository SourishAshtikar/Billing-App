import React, { useState, useEffect, useContext } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Alert, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // ...

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [leaves, setLeaves] = useState([]);
    const [newLeave, setNewLeave] = useState({ date: '', reason: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/employee/leaves');
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkLeave = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.post('/employee/leaves', newLeave);
            setMessage('Leave marked successfully!');
            setNewLeave({ date: '', reason: '' });
            fetchLeaves();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark leave');
        }
    };

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);

    const handleDeleteLeave = async (id) => {
        console.log("Delete requested for ID:", id);
        // if (!window.confirm("Are you sure you want to delete this leave?")) return; // Temporarily removed for debugging
        try {
            console.log("Sending DELETE request...");
            await api.delete(`/employee/leaves/${id}`);
            console.log("Delete success");
            setMessage('Leave deleted successfully!');
            fetchLeaves();
            if (editDialogOpen) setEditDialogOpen(false);
        } catch (err) {
            console.error("Delete failed:", err);
            setError("Failed to delete leave");
        }
    };


    const handleEditClick = (leave) => {
        setEditingLeave({ ...leave });
        setEditDialogOpen(true);
    };

    const handleUpdateLeave = async () => {
        try {
            await api.put(`/employee/leaves/${editingLeave.id}`, {
                date: editingLeave.date,
                reason: editingLeave.reason
            });
            setMessage('Leave updated successfully!');
            setEditDialogOpen(false);
            fetchLeaves();
        } catch (err) {
            console.error(err);
            setError("Failed to update leave");
        }
    };

    // ...

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Welcome, {currentUser?.name}</Typography>
                <Button variant="outlined" onClick={handleLogout}>Logout</Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Mark Leave</Typography>
                        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Box component="form" onSubmit={handleMarkLeave}>
                            <TextField
                                type="date"
                                required
                                fullWidth
                                label="Date" // Label doesn't show well with type=date without shrink, but is fine for now
                                InputLabelProps={{ shrink: true }}
                                margin="normal"
                                value={newLeave.date}
                                onChange={(e) => setNewLeave({ ...newLeave, date: e.target.value })}
                            />
                            <TextField
                                required
                                fullWidth
                                label="Reason"
                                margin="normal"
                                value={newLeave.reason}
                                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                            />
                            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
                                Submit Leave
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>My Leaves</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaves && leaves.length > 0 ? (
                                        leaves.map((leave) => (
                                            <TableRow key={leave.id}>
                                                <TableCell>{leave.date}</TableCell>
                                                <TableCell>{leave.reason}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleEditClick(leave)} color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center">No leaves marked.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Edit Leave Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Edit Leave</DialogTitle>
                <DialogContent>
                    {editingLeave && (
                        <>
                            <TextField
                                margin="dense"
                                label="Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={editingLeave.date}
                                onChange={(e) => setEditingLeave({ ...editingLeave, date: e.target.value })}
                            />
                            <TextField
                                margin="dense"
                                label="Reason"
                                type="text"
                                fullWidth
                                value={editingLeave.reason}
                                onChange={(e) => setEditingLeave({ ...editingLeave, reason: e.target.value })}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleDeleteLeave(editingLeave?.id)} color="error">
                        Delete
                    </Button>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateLeave} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default EmployeeDashboard;
