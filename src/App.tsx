import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ComplaintsProvider } from './contexts/ComplaintsContext';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewComplaintPage from './pages/NewComplaintPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import HelpPage from './pages/HelpPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ComplaintsProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            
            {/* Protected routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/new-complaint" element={<NewComplaintPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<ProfilePage />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ComplaintsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;