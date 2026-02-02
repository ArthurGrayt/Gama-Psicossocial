
// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Formularios } from './pages/Formularios';
import { ModelosPage } from './pages/ModelosPage';
import { FormularioPublico } from './pages/FormularioPublico';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          {/* Admin / Dashboard Route */}
          <Route path="/" element={<Formularios />} />
          <Route path="/modelos" element={<ModelosPage />} />

          {/* Public Form Route */}
          <Route path="/form/:slug" element={<FormularioPublico />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
