import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import MyBookingsPage from './pages/MyBookingsPage';
import { isAuthenticated, getUserRole } from './services/auth';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 페이지 로드 시 로그인 상태 확인
    if (isAuthenticated()) {
      setUser({
        isLoggedIn: true,
        role: getUserRole()
      });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
      <Router>
        <div className="App">
          <Header user={user} onLogout={handleLogout} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                  path="/login"
                  element={
                    user?.isLoggedIn ?
                        <Navigate to="/" /> :
                        <LoginPage onLogin={handleLogin} />
                  }
              />
              <Route
                  path="/register"
                  element={
                    user?.isLoggedIn ?
                        <Navigate to="/" /> :
                        <RegisterPage />
                  }
              />
              <Route
                  path="/booking/:performanceId"
                  element={
                    user?.isLoggedIn ?
                        <BookingPage /> :
                        <Navigate to="/login" />
                  }
              />
              <Route
                  path="/my-bookings"
                  element={
                    user?.isLoggedIn ?
                        <MyBookingsPage /> :
                        <Navigate to="/login" />
                  }
              />
              <Route
                  path="/admin"
                  element={
                    user?.role === 'ROLE_ADMIN' ?
                        <AdminPage /> :
                        <Navigate to="/" />
                  }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
  );
}

export default App;