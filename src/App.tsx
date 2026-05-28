import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import TrackComplaint from '@/pages/TrackComplaint';
import Login from '@/pages/Login';
import PoliceDashboard from '@/pages/PoliceDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import CitizenDashboard from '@/pages/CitizenDashboard';
import StationFinder from '@/pages/StationFinder';
import ProtectedRoute from '@/components/ProtectedRoute';
import FileFIR from '@/pages/FileFIR';
import { useAuthStore } from '@/store/authStore';

function CitizenRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'police') return <Navigate to="/police" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { isAuthenticated, role } = useAuthStore();
  if (isAuthenticated) {
    if (role === 'police') return <Navigate to="/police" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/citizen" replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/file-fir" element={<FileFIR />} />
        <Route path="/file-complaint" element={<FileFIR />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/stations" element={<StationFinder />} />
        <Route path="/find-station" element={<StationFinder />} />
        <Route path="/login" element={<LoginRoute />} />

        {/* Citizen */}
        <Route path="/citizen" element={<CitizenRoute><CitizenDashboard /></CitizenRoute>} />

        {/* Police */}
        <Route element={<ProtectedRoute allowedRoles={['police', 'admin']} />}>
          <Route path="/police/*" element={<PoliceDashboard />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
