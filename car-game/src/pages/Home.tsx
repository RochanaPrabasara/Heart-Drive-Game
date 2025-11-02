import React from 'react';
import { PlayIcon } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gray-900 relative overflow-hidden pt-28">
      <div className="absolute w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="z-10 text-center px-4 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
          Heart Drive 
        </h1>

        <p className="text-xl md:text-2xl mb-12 max-w-2xl text-gray-300 mx-auto">
          Navigate through obstacles, test your reflexes, and solve heart
          challenges to achieve the highest score!
        </p>

        <a
          href="/login"
          className="inline-flex items-center px-8 py-4 text-xl font-bold rounded-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 transform hover:scale-105 transition duration-300 shadow-lg"
        >
          <PlayIcon size={24} className="mr-2" />
          LOG IN TO PLAY
        </a>


        <div className="mt-12 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
          {[
            { title: 'DRIVE', text: 'Navigate through challenging roads' },
            { title: 'SOLVE', text: 'Count hearts to continue after crashes' },
            { title: 'COMPETE', text: 'Climb the global leaderboard' },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-gray-800 p-6 rounded-lg text-center w-64 h-36 flex flex-col justify-center"
            >
              <h3 className="text-red-400 font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-300">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
