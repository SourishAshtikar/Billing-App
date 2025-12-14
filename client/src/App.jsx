import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline, Container } from '@mui/material';

// Placeholders for now
// const AdminDashboard = () => <h2>Admin Dashboard (Coming Soon)</h2>;
// const EmployeeDashboard = () => <h2>Employee Dashboard (Coming Soon)</h2>;

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <Container maxWidth="lg">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Container>
    </AuthProvider>
  );
}

export default App;
