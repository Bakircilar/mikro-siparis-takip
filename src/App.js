import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import UserManagement from './components/UserManagement'; // Yeni bileşen
import GlobalStyles from './styles/GlobalStyles';
import './App.css';

// Korumalı rota bileşeni - sadece giriş yapanlar erişebilir
const ProtectedRoute = ({ children }) => {
  const userRole = sessionStorage.getItem('userRole');
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin erişimi gerektiren rota bileşeni
const AdminRoute = ({ children }) => {
  const userRole = sessionStorage.getItem('userRole');
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <GlobalStyles />
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <AdminRoute>
                <Analytics />
              </AdminRoute>
            } 
          />
          {/* Yeni rota: Kullanıcı Yönetimi */}
          <Route 
            path="/users" 
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;