import React from 'react';
import { CarIcon, TrophyIcon, UserIcon, LogOutIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  // ✅ FIXED: Show auth options on BOTH gamehome AND game (play area)
  const showAuthOptions = isLoggedIn && ['/gamehome', '/game'].includes(location.pathname);

  return (
    <nav className="bg-gray-800 py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <CarIcon className="text-red-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-red-500 to-pink-500">
            Heart Drive
          </span>
        </Link>
        <div className="flex space-x-6 items-center">
          {showAuthOptions ? (
            <>
              <Link
                to="/scoreboard"
                className="flex items-center space-x-1 text-red-100 hover:text-red-400 transition"
              >
                <TrophyIcon size={18} />
                <span>Scoreboard</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-1 text-red-100 hover:text-red-400 transition"
              >
                <UserIcon size={18} />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-100 hover:text-red-400 transition"
              >
                <LogOutIcon size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-6 py-2 rounded-md text-white font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;