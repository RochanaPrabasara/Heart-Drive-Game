import React from 'react';
import { PlayIcon } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center bg-gray-900 relative overflow-hidden">
      <div className="absolute w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>
      <div className="z-10 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-r from-red-500 to-pink-500">
          Heart Drive Car Game
        </h1>
        <p className="text-xl md:text-2xl mb-12 max-w-2xl text-gray-300">
          Navigate through obstacles, test your reflexes, and solve heart
          challenges to achieve the highest score!
        </p>
        <a
          href="/login"
          className="inline-flex items-center px-8 py-4 text-xl font-bold rounded-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 transform hover:scale-105 transition duration-300 shadow-lg"
        >
          <PlayIcon size={24} className="mr-2" />
          LOG IN TO PLAY
        </a>
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="bg-gray-800 p-4 rounded-lg text-center w-64">
            <h3 className="text-red-400 font-semibold">DRIVE</h3>
            <p className="text-gray-300">Navigate through challenging roads</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center w-64">
            <h3 className="text-red-400 font-semibold">SOLVE</h3>
            <p className="text-gray-300">
              Count hearts to continue after crashes
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center w-64">
            <h3 className="text-red-400 font-semibold">COMPETE</h3>
            <p className="text-gray-300">Climb the global leaderboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;