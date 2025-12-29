import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Layout from '@/components/layout/Layout';
import AuthLayout from '@/components/layout/AuthLayout';

import Dashboard from '@/pages/Dashboard';

import LiveAudio from '@/pages/LiveAudio';
import UploadAudio from '@/pages/UploadAudio';
import UploadVideo from '@/pages/UploadVideo';
import VideoPlayer from '@/pages/VideoPlayer';
import History from '@/pages/History';
import Settings from '@/pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="live-audio" element={<LiveAudio />} />
            <Route path="upload-audio" element={<UploadAudio />} />
            <Route path="upload-video" element={<UploadVideo />} />
            <Route path="video-player" element={<VideoPlayer />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
