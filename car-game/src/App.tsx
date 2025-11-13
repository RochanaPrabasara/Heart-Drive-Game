import React, { useEffect, useState, Component } from 'react';
import type { ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/navbar/navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/Signup';
import GameHome from './pages/GameHome';
import Game from './pages/Game';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from './auth/auth';

interface DecodedToken {
  userId: string;
  exp: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-white text-center p-8">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      } catch {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
        <Router>
          <div className="w-full h-screen bg-gray-900 flex flex-col">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/gamehome" element={<GameHome />} />
              <Route path="/game" element={isLoggedIn ? <Game /> : <Navigate to="/login" />}
              />
            </Routes>
          </div>
        </Router>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export default App;