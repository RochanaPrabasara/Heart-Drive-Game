import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SignUp: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateInputs = () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateInputs()) return;

    try {
      await axios.post('http://localhost:5000/api/auth/signup', {
        username,
        email,
        password,
      });
      navigate('/login');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to sign up. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gray-900 relative overflow-hidden pt-8">
      <div className="absolute w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>
      <div className="z-10 flex flex-col items-center justify-center w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-red-500 w-full text-center whitespace-nowrap">
          Sign Up for Heart-Drive
        </h1>
        <div className="bg-gray-800 p-12 rounded-lg shadow-lg w-full max-w-md">
          <p className="text-gray-300 mb-8 text-lg text-center">
            Create an account to play the game
          </p>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-lg font-bold rounded-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 transition duration-300 shadow-lg"
            >
              Sign Up
            </button>
            <p className="text-gray-300 text-sm text-center mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-400 transition">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;