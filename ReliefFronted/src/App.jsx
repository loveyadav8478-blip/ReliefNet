import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage          from './pages/LandingPage';
import LoginPage            from './pages/auth/LoginPage';
import RegisterPage         from './pages/auth/RegisterPage';
import { VolunteerDashboard, AdminDashboard } from './pages/Dashboards';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import ReporterHome         from './pages/reporter/ReporterHome';
import ReporterDashboard    from './pages/reporter/ReporterDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FFFE' }}>
      <div style={{ width:36, height:36, border:'3px solid #D1FAE5', borderTopColor:'#16A34A', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace/>;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace/>;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace/>;
  const routes = {
    ADMIN:       '/coordinator/dashboard',
    COORDINATOR: '/coordinator/dashboard',
    VOLUNTEER:   '/volunteer/dashboard',
    REPORTER:    '/reporter/dashboard',
  };
  return <Navigate to={routes[user.role] || '/login'} replace/>;
}

function UnauthorizedPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#F8FFFE' }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <h1 style={{ fontSize:28, fontWeight:800, color:'#0F2419' }}>Access Denied</h1>
      <p style={{ color:'#86BFAA', fontSize:15 }}>You don't have permission to view this page.</p>
      <a href="/login" style={{ color:'#16A34A', fontWeight:600, fontSize:14 }}>← Back to login</a>
    </div>
  );
}

const coord = ['COORDINATOR', 'ADMIN'];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"             element={<LandingPage/>}/>
      <Route path="/login"        element={<LoginPage/>}/>
      <Route path="/register"     element={<RegisterPage/>}/>
      <Route path="/unauthorized" element={<UnauthorizedPage/>}/>
      <Route path="/home"         element={<RoleRedirect/>}/>

      <Route path="/coordinator/dashboard" element={
        <ProtectedRoute allowedRoles={coord}><CoordinatorDashboard/></ProtectedRoute>
      }/>
      <Route path="/volunteer/dashboard" element={
        <ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerDashboard/></ProtectedRoute>
      }/>
      <Route path="/reporter/dashboard" element={
        <ProtectedRoute allowedRoles={['REPORTER']}><ReporterHome/></ProtectedRoute>
      }/>
      <Route path="/reporter/submit" element={
        <ProtectedRoute allowedRoles={['REPORTER']}><ReporterDashboard/></ProtectedRoute>
      }/>
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard/></ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              background: 'white',
              color: '#0F2419',
              border: '1px solid #A7F3D0',
              boxShadow: '0 8px 24px rgba(22,163,74,0.12)',
            },
            success: { iconTheme: { primary:'#16A34A', secondary:'white' } },
            error:   { iconTheme: { primary:'#EF4444', secondary:'white' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}