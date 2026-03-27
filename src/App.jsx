import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Absensi from './pages/Absensi';
import Izin from './pages/Izin';
import Riwayat from './pages/Riwayat';
import Pegawai from './pages/Pegawai';
import ValidasiIzin from './pages/ValidasiIzin';
import Laporan from './pages/Laporan';
import Pengaturan from './pages/Pengaturan';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/absensi" element={<PrivateRoute><Absensi /></PrivateRoute>} />
            <Route path="/izin" element={<PrivateRoute><Izin /></PrivateRoute>} />
            <Route path="/riwayat" element={<PrivateRoute><Riwayat /></PrivateRoute>} />
            <Route path="/pegawai" element={<PrivateRoute><Pegawai /></PrivateRoute>} />
            <Route path="/validasi" element={<PrivateRoute><ValidasiIzin /></PrivateRoute>} />
            <Route path="/laporan" element={<PrivateRoute><Laporan /></PrivateRoute>} />
            <Route path="/pengaturan" element={<PrivateRoute><Pengaturan /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
