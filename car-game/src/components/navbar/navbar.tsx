import React from 'react';
import { CarIcon, TrophyIcon, UserIcon, LogOutIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  const showAuthOptions = isLoggedIn && location.pathname === '/game';

  return (
    <nav className="bg-gray-800 py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="flex items-center space-x-2">
          <CarIcon className="text-red-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-red-500 to-pink-500">
            Heart Drive
          </span>
        </a>
        <div className="flex space-x-6 items-center">
          {showAuthOptions ? (
            <>
              <a href="/scoreboard" className="flex items-center space-x-1 text-red-100 hover:text-red-400 transition">
                <TrophyIcon size={18} />
                <span>Scoreboard</span>
              </a>
              <a href="/profile" className="flex items-center space-x-1 text-red-100 hover:text-red-400 transition">
                <UserIcon size={18} />
                <span>Profile</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-100 hover:text-red-400 transition"
              >
                <LogOutIcon size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <a href="/login" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition">
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;