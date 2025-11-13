import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, RotateCcw, ArrowLeft, X } from 'lucide-react'; // Added X icon
import { useAuth } from '../auth/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchHeartChallenge } from '../api/HeartAPI';
import type { HeartChallenge } from '../api/HeartAPI';

interface Barrier {
  id: number;
  lane: number;
  y: number;
  passed: boolean;
}

interface GameState {
  phase: 'playing' | 'crashed' | 'gameover' | 'exit_confirm'; // Added exit_confirm
  score: number;
  carLane: number;
  barriers: Barrier[];
  challenge: HeartChallenge | null;
  userAnswer: string;
}

const LANES = 3;
const LANE_WIDTH = 120;
const CAR_WIDTH = 120;
const CAR_HEIGHT = 110;
const BARRIER_WIDTH = 80;
const BARRIER_HEIGHT = 60;
const ROAD_SPEED = 5;
const BARRIER_SPAWN_RATE = 0.02;

type GameEvent =
  | { type: 'CRASH' }
  | { type: 'BARRIER_PASSED'; score: number }
  | { type: 'HEART_ANSWER_CORRECT' }
  | { type: 'HEART_ANSWER_WRONG' }
  | { type: 'RESTART' }
  | { type: 'EXIT_REQUEST' }; // Added exit request

class EventBus {
  private listeners: ((event: GameEvent) => void)[] = [];

  subscribe(listener: (event: GameEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  publish(event: GameEvent) {
    this.listeners.forEach((l) => l(event));
  }
}

const eventBus = new EventBus();

const Game: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barriersRef = useRef<Barrier[]>([]);
  const scoreRef = useRef(0);

  const carImageRef = useRef<HTMLImageElement | null>(null);

  const [challenge, setChallenge] = useState<HeartChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'playing',
    score: 0,
    carLane: 1,
    barriers: [],
    challenge: null,
    userAnswer: '',
  });

  useEffect(() => {
    const img = new Image();
    img.src = '/images/car.png';
    img.onload = () => (carImageRef.current = img);
    img.onerror = () => console.warn('Car image not found! Falling back to blue rectangle.');
  }, []);

  const saveScore = async (score: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.post(
        'http://localhost:5000/api/score/save',
        { score },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Score saved:', score);
    } catch (e) {
      console.error('Failed to save score:', e);
    }
  };

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.phase !== 'playing') return;
      
      if (e.key === 'ArrowLeft' && gameState.carLane > 0)
        setGameState((s) => ({ ...s, carLane: s.carLane - 1 }));
      if (e.key === 'ArrowRight' && gameState.carLane < LANES - 1)
        setGameState((s) => ({ ...s, carLane: s.carLane + 1 }));
      
      // ESC now shows confirmation
      if (e.key === 'Escape') {
        eventBus.publish({ type: 'EXIT_REQUEST' });
      }
    },
    [gameState.phase, gameState.carLane]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.phase !== 'playing') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    for (let i = 1; i < LANES; i++) {
      const x = (canvas.width / LANES) * i;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (Math.random() < BARRIER_SPAWN_RATE) {
      const lane = Math.floor(Math.random() * LANES);
      barriersRef.current.push({
        id: Date.now() + Math.random(),
        lane,
        y: -BARRIER_HEIGHT,
        passed: false,
      });
    }

    barriersRef.current = barriersRef.current.filter((b) => {
      b.y += ROAD_SPEED;
      const laneX = (canvas.width / LANES) * b.lane + (LANE_WIDTH - BARRIER_WIDTH) / 2;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(laneX, b.y, BARRIER_WIDTH, BARRIER_HEIGHT);

      const carX = (canvas.width / LANES) * gameState.carLane + (LANE_WIDTH - CAR_WIDTH) / 2;
      const carY = canvas.height - CAR_HEIGHT - 50;

      if (
        !b.passed &&
        b.y + BARRIER_HEIGHT > carY &&
        b.y < carY + CAR_HEIGHT &&
        Math.abs(carX - laneX) < (CAR_WIDTH + BARRIER_WIDTH) / 2
      ) {
        eventBus.publish({ type: 'CRASH' });
        b.passed = true;
      }

      if (!b.passed && b.y > carY + CAR_HEIGHT) {
        b.passed = true;
        scoreRef.current += 10;
        eventBus.publish({ type: 'BARRIER_PASSED', score: scoreRef.current });
      }

      return b.y < canvas.height + BARRIER_HEIGHT;
    });

    const carX = (canvas.width / LANES) * gameState.carLane + (LANE_WIDTH - CAR_WIDTH) / 2;
    const carY = canvas.height - CAR_HEIGHT - 50;
    if (carImageRef.current) {
      ctx.drawImage(carImageRef.current, carX, carY, CAR_WIDTH, CAR_HEIGHT);
    } else {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.carLane, gameState.phase]);

  useEffect(() => {
    if (gameState.phase === 'playing') animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameLoop, gameState.phase]);

  useEffect(() => {
    const handleCrash = async () => {
      setGameState((s) => ({ ...s, phase: 'crashed', challenge: null, userAnswer: '' }));
      setIsLoading(true);
      setImageReady(false);
      setChallenge(null);
      try {
        const newChallenge = await fetchHeartChallenge();
        setChallenge(newChallenge);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const handleBarrierPassed = ({ score }: { score: number }) => {
      setGameState((s) => ({ ...s, score }));
    };

    const handleHeartCorrect = () => {
      barriersRef.current = [];
      setGameState((s) => ({
        ...s,
        phase: 'playing',
        challenge: null,
        userAnswer: '',
      }));
      setImageReady(false);
      setChallenge(null);
    };

    const handleHeartWrong = () => {
      saveScore(gameState.score); // Score saved here
      setGameState((s) => ({ ...s, phase: 'gameover' }));
    };

    const handleExitRequest = () => {
      saveScore(gameState.score); // Score saved here too!
      setGameState((s) => ({ ...s, phase: 'exit_confirm' }));
    };

    const handleRestart = () => {
      barriersRef.current = [];
      scoreRef.current = 0;
      setGameState({
        phase: 'playing',
        score: 0,
        carLane: 1,
        barriers: [],
        challenge: null,
        userAnswer: '',
      });
      setImageReady(false);
      setChallenge(null);
    };

    const unsubscribe = eventBus.subscribe((e) => {
      if (e.type === 'CRASH') handleCrash();
      if (e.type === 'BARRIER_PASSED') handleBarrierPassed(e);
      if (e.type === 'HEART_ANSWER_CORRECT') handleHeartCorrect();
      if (e.type === 'HEART_ANSWER_WRONG') handleHeartWrong();
      if (e.type === 'EXIT_REQUEST') handleExitRequest(); // New handler
      if (e.type === 'RESTART') handleRestart();
    });
    return () => unsubscribe();
  }, [gameState.score]);

  const submitHeartAnswer = () => {
    const answer = parseInt(gameState.userAnswer, 10);
    if (answer === challenge?.solution) {
      eventBus.publish({ type: 'HEART_ANSWER_CORRECT' });
    } else {
      eventBus.publish({ type: 'HEART_ANSWER_WRONG' });
    }
  };

  const handlePlayAgain = async () => {
    await saveScore(gameState.score);
    eventBus.publish({ type: 'RESTART' });
  };

  const handleBackToHome = async () => {
    await saveScore(gameState.score);
    navigate('/gamehome');
  };

  // NEW: Exit confirmation handlers
  const handleConfirmExit = async () => {
    await saveScore(gameState.score);
    navigate('/gamehome');
  };

  const handleCancelExit = () => {
    setGameState((s) => ({ ...s, phase: 'playing' }));
  };

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const isHeartModalOpen = gameState.phase === 'crashed';
  const isLoadingImage = isLoading || !imageReady;
  const isExitModalOpen = gameState.phase === 'exit_confirm';
  const isGameOverModalOpen = gameState.phase === 'gameover';

  return (
    <div className="relative w-full min-h-screen bg-gray-900 overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      </div>

      {/* Score */}
      {gameState.phase === 'playing' && (
        <div className="absolute top-6 left-6 z-20 bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-xl font-bold text-white">
            Score: <span className="text-red-400">{gameState.score}</span>
          </p>
        </div>
      )}

      {/* Controls */}
      {gameState.phase === 'playing' && (
        <div className="absolute top-6 right-6 z-20 bg-gray-800 px-4 py-2 rounded-lg shadow-lg text-sm text-gray-300">
          ← → Move | ESC Exit
        </div>
      )}

      {/* Canvas */}
      {['playing', 'crashed'].includes(gameState.phase) && (
        <canvas
          ref={canvasRef}
          width={LANE_WIDTH * LANES}
          height={600}
          className="border-4 border-gray-700 rounded-xl shadow-2xl z-10 max-w-full"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Heart Challenge Modal */}
      {isHeartModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg h-[520px] flex flex-col items-center text-center transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            <AlertCircle className="mb-4 text-red-500 animate-pulse" size={48} />
            <h2 className="text-3xl font-bold text-white mb-2">Crash! Count the Hearts!</h2>
            <p className="text-sm text-gray-400 mb-4">Answer correctly to keep driving.</p>

            <div className="relative w-full flex-1 flex items-center justify-center mb-4 overflow-hidden rounded-lg">
              {isLoadingImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg z-10">
                  <div className="w-14 h-14 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin mb-3" />
                  <p className="text-gray-300 text-sm">Loading hearts...</p>
                </div>
              )}
              {challenge && (
                <img
                  src={challenge.imageUrl}
                  alt="Heart challenge"
                  onLoad={() => setImageReady(true)}
                  className={`mx-auto rounded-lg shadow-lg max-w-full h-48 object-contain transition-opacity duration-500 ${
                    imageReady ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </div>

            <div className="w-full">
              <input
                type="number"
                value={gameState.userAnswer}
                onChange={(e) => setGameState((s) => ({ ...s, userAnswer: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && submitHeartAnswer()}
                placeholder="How many hearts?"
                disabled={isLoadingImage}
                className="w-full px-4 py-3 mb-4 bg-gray-700 text-white rounded-lg text-center text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={submitHeartAnswer}
                disabled={isLoadingImage}
                className="w-full cursor-pointer py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Exit Confirmation Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 max-w-md w-full text-center transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            <X className="mx-auto mb-4 text-yellow-500" size={48} />
            <h2 className="text-3xl font-bold text-white mb-4">Exit Game?</h2>
            <p className="text-xl text-gray-300 mb-2">
              Final Score: <span className="text-yellow-400 font-bold">{gameState.score}</span>
            </p>
            <p className="text-lg text-gray-400 mb-8">Your score has been saved!</p>
            <div className="space-y-3">
              <button
                onClick={handleConfirmExit}
                className="w-full cursor-pointer py-3 bg-linear-to-r from-orange-600 to-orange-500 text-white font-bold rounded-lg hover:from-orange-500 hover:to-orange-400 transition shadow-lg flex items-center justify-center"
              >
                <ArrowLeft className="mr-2" size={20} />
                Exit to Home
              </button>
              <button
                onClick={handleCancelExit}
                className="w-full cursor-pointer py-3 bg-linear-to-r from-gray-600 to-gray-700 text-white font-bold rounded-lg hover:from-gray-500 hover:to-gray-600 transition shadow-lg flex items-center justify-center"
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOverModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 max-w-md w-full text-center transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            <h2 className="text-5xl font-bold text-red-500 mb-4">Game Over !</h2>
            <p className="text-2xl text-white mb-2">
              Final Score: <span className="text-yellow-400">{gameState.score}</span>
            </p>
            <p className="text-lg text-gray-400 mb-8">Wrong heart count !</p>
            <div className="space-y-3">
              <button
                onClick={handlePlayAgain}
                className="w-full cursor-pointer py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-indigo-500 transition shadow-lg flex items-center justify-center"
              >
                <RotateCcw className="mr-2" size={20} />
                Play Again
              </button>
              <button
                onClick={handleBackToHome}
                className="w-full cursor-pointer flex items-center justify-center py-3 bg-linear-to-r from-gray-600 to-gray-700 text-white font-bold rounded-lg hover:from-gray-500 hover:to-gray-600 transition shadow-lg"
              >
                <ArrowLeft className="mr-2" size={20} />
                Back to Home
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">Press ESC anytime during game</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;