import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, TrophyIcon, TargetIcon, ZapIcon } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../auth/auth';


interface UserStats {
  username: string;
  highScore: number;
  gamesPlayed: number;
  rank: number;
}

interface LeaderboardPlayer {
  rank: number;
  username: string;
  score: number;
  gamesPlayed?: number;
}

const GameHome: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isLoggedIn, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch user stats
      const statsRes = await axios.get('http://localhost:5000/api/score/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(statsRes.data);

      // Fetch leaderboard - FIXED: Get unique players with highest scores
      const leaderboardRes = await axios.get('http://localhost:5000/api/score/leaderboard');
      
      // Process to ensure unique usernames with highest scores only
      const uniqueLeaderboard = processUniqueLeaderboard(leaderboardRes.data);
      setLeaderboard(uniqueLeaderboard);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Process leaderboard to show UNIQUE players with HIGHEST scores only
  const processUniqueLeaderboard = (players: LeaderboardPlayer[]): LeaderboardPlayer[] => {
    const scoreMap = new Map<string, LeaderboardPlayer>();
    
    // Group by username and keep highest score
    players.forEach(player => {
      if (!scoreMap.has(player.username)) {
        scoreMap.set(player.username, player);
      } else {
        const existing = scoreMap.get(player.username)!;
        if (player.score > existing.score) {
          scoreMap.set(player.username, player);
        }
      }
    });
    
    // Sort by score descending and assign ranks
    const sortedUnique = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
    
    return sortedUnique;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your stats...</div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-red-500 to-pink-500">
            Welcome Back, {userStats?.username} !
          </h1>
          <p className="text-gray-400 text-lg">
            Ready to beat your high score and climb the leaderboard?
          </p>
        </div>

        {/* Stats and Play Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Personal Stats Card */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-red-400">Your Stats</h2>
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrophyIcon className="text-yellow-400 mr-2" size={24} />
                    <span className="text-gray-300">High Score</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {userStats?.highScore?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TargetIcon className="text-blue-400 mr-2" size={24} />
                    <span className="text-gray-300">Games Played</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {userStats?.gamesPlayed || 0}
                  </span>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ZapIcon className="text-green-400 mr-2" size={24} />
                    <span className="text-gray-300">Global Rank</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    #{userStats?.rank || '?'}
                  </span>
                </div>
              </div>
            </div>
            {/* Play Button - FIXED: Navigate to /play */}
            <button
              onClick={() => navigate('/game')}
              className="mt-6 w-full flex items-center cursor-pointer justify-center px-8 py-4 text-xl font-bold rounded-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <PlayIcon size={24} className="mr-2" />
              PLAY NOW
            </button>
          </div>

          {/* Leaderboard Card - FIXED: Shows unique players */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-400">Top Players</h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.length > 0 ? (
                leaderboard.map((player) => (
                  <div
                    key={`${player.username}-${player.rank}`}
                    className={`flex items-center cursor-pointer justify-between p-4 rounded-lg transition-all ${
                      player.rank <= 3 ? 'bg-linear-to-r from-gray-700 to-gray-600 shadow-md' : 'bg-gray-750 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                          player.rank === 1
                            ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-gray-900'
                            : player.rank === 2
                            ? 'bg-linear-to-r from-gray-300 to-gray-200 text-gray-900'
                            : player.rank === 3
                            ? 'bg-linear-to-r from-amber-600 to-amber-700 text-white'
                            : 'bg-gray-600 text-gray-200'
                        }`}
                      >
                        #{player.rank}
                      </div>
                      <span className="font-semibold text-white truncate max-w-xs">
                        {player.username}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrophyIcon size={20} className="text-yellow-400" />
                      <span className="font-mono font-bold text-lg text-white">
                        {player.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrophyIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No players yet!</p>
                  <p className="text-sm">Be the first to climb the leaderboard</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl text-center hover:shadow-2xl transition-all group">
            <div className="w-16 h-16 bg-linear-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <PlayIcon size={28} className="text-white" />
            </div>
            <h3 className="text-red-400 font-bold mb-3 text-lg">DRIVE</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Navigate through three lanes and dodge red barriers
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl text-center hover:shadow-2xl transition-all group">
            <div className="w-16 h-16 bg-linear-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <TrophyIcon size={28} className="text-white" />
            </div>
            <h3 className="text-red-400 font-bold mb-3 text-lg">SOLVE</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Count hearts correctly to continue after crashes
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl text-center hover:shadow-2xl transition-all group">
            <div className="w-16 h-16 bg-linear-to-r from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <TargetIcon size={28} className="text-white" />
            </div>
            <h3 className="text-red-400 font-bold mb-3 text-lg">COMPETE</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Beat your high score and climb the global leaderboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHome;