import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import Projects from './pages/Projects';
import Leaves from './pages/Leaves';
import BillingReports from './pages/BillingReports';
import Login from './pages/Login';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import ResourceDashboard from './pages/ResourceDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // Fallback
  }

  return children;
};
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'MANAGER') return <ManagerDashboard />;
  return <ResourceDashboard />; // RESOURCE
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={
        <ProtectedRoute>
          <Layout role={user?.role} />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<RoleBasedDashboard />} />

        {/* Admin Routes */}
        <Route path="/projects" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/resources" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Resources />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <BillingReports />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Resource Routes */}
        <Route path="/leaves" element={<Leaves />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
