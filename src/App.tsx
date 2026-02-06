
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

function App() {
  return (
    <Router>
      <AuthProvider>
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


            {/* Public Form Route (Should probably remain public?) Assuming yes for now */}
            <Route path="/form/:slug" element={<FormularioPublico />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
