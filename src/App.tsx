
// import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Formularios } from './pages/Formularios';
import { ModelosPage } from './pages/ModelosPage';
import { FormularioPublico } from './pages/FormularioPublico';
import { CadastroPage } from './pages/CadastroPage';
import { DashboardPage } from './pages/DashboardPage';

import { LandingPage } from './pages/LandingPage';
import { useAuth } from './contexts/AuthContext';
import { FirstAccessModal } from './components/modals/FirstAccessModal';

function AppContent() {
  const { profile, user } = useAuth();
  console.log('AppContent render - profile:', profile);
  if (profile) {
    console.log('AppContent render - primeiro_acesso:', profile.primeiro_acesso);
    console.log('AppContent render - Is modal open condition:', profile.primeiro_acesso === true);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Auth Route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Admin / Dashboard Route (Protected) */}
        <Route path="/atividades" element={
          <ProtectedRoute>
            <Formularios />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/modelos" element={
          <ProtectedRoute>
            <ModelosPage />
          </ProtectedRoute>
        } />
        <Route path="/cadastro" element={
          <ProtectedRoute>
            <CadastroPage />
          </ProtectedRoute>
        } />

        {/* Public Form Route */}
        <Route path="/form/:slug" element={<FormularioPublico />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      {/* Show if user exists, profile is loaded, and primeiro_acesso is NOT explicitly false */}
      <FirstAccessModal isOpen={!!user && !!profile && profile.primeiro_acesso !== false} />

      {/* DEBUG OVERLAY - REMOVE AFTER FIXING */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-[9999] max-w-sm pointer-events-none">
          <p>User: {user ? 'Logged In' : 'Null'}</p>
          <p>Profile: {profile ? 'Loaded' : 'Null'}</p>
          <p>Primeiro Acesso: {String(profile?.primeiro_acesso)}</p>
          <p>Modal Check: {String(!!user && !!profile && profile?.primeiro_acesso !== false)}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
