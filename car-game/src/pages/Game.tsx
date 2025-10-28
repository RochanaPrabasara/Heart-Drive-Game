// car-game/src/pages/Game.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, AlertCircle, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../auth';

// ========================
// TYPES & CONSTANTS
// ========================

interface HeartChallenge {
  imageUrl: string;
  solution: number;
}

interface GameState {
  phase: 'ready' | 'playing' | 'crashed' | 'gameover';
  score: number;
  carLane: number; // 0, 1, 2
  barriers: Barrier[];
  challenge: HeartChallenge | null;
  userAnswer: string;
}

interface Barrier {
  id: number;
  lane: number;
  y: number;
  passed: boolean;
}

// Game Config
const LANES = 3;
const LANE_WIDTH = 120;
const CAR_WIDTH = 60;
const CAR_HEIGHT = 100;
const BARRIER_WIDTH = 80;
const BARRIER_HEIGHT = 60;
const ROAD_SPEED = 5;
const BARRIER_SPAWN_RATE = 0.02;

// API
const HEART_API = 'https://marcconrad.com/uob/heart/api.php?out=json&base64=no';

// ========================
// EVENT BUS (Event-Driven)
// ========================

type GameEvent =
  | { type: 'CRASH' }
  | { type: 'BARRIER_PASSED'; score: number }
  | { type: 'HEART_ANSWER_CORRECT' }
  | { type: 'HEART_ANSWER_WRONG' }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART' };

class EventBus {
  private listeners: ((event: GameEvent) => void)[] = [];

  subscribe(listener: (event: GameEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: GameEvent) {
    this.listeners.forEach((l) => l(event));
  }
}

const eventBus = new EventBus();

// ========================
// GAME COMPONENT
// ========================

const Game: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barriersRef = useRef<Barrier[]>([]);
  const scoreRef = useRef(0);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'ready',
    score: 0,
    carLane: 1,
    barriers: [],
    challenge: null,
    userAnswer: '',
  });

  // ========================
  // KEYBOARD INPUT (Event-Driven)
  // ========================

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState.phase !== 'playing') return;

    if (e.key === 'ArrowLeft' && gameState.carLane > 0) {
      setGameState((s) => ({ ...s, carLane: s.carLane - 1 }));
    }
    if (e.key === 'ArrowRight' && gameState.carLane < LANES - 1) {
      setGameState((s) => ({ ...s, carLane: s.carLane + 1 }));
    }
  }, [gameState.phase, gameState.carLane]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // ========================
  // HEART API SERVICE (Interoperability)
  // ========================

  const fetchHeartChallenge = async (): Promise<HeartChallenge> => {
    try {
      const res = await axios.get(HEART_API);
      const { question, solution } = res.data;
      return { imageUrl: question, solution: parseInt(solution) };
    } catch (err) {
      console.error('Heart API failed:', err);
      // Fallback image
      return {
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjk5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGxbPSIjYjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SGVhcnQgQVBJIEZhaWxlZDwvdGV4dD48L3N2Zz4=',
        solution: 3,
      };
    }
  };

  // ========================
  // GAME LOOP
  // ========================

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.phase !== 'playing') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road lines
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

    // Spawn barriers
    if (Math.random() < BARRIER_SPAWN_RATE) {
      const lane = Math.floor(Math.random() * LANES);
      barriersRef.current.push({
        id: Date.now(),
        lane,
        y: -BARRIER_HEIGHT,
        passed: false,
      });
    }

    // Update & draw barriers
    barriersRef.current = barriersRef.current.filter((b) => {
      b.y += ROAD_SPEED;

      // Draw
      const laneX = (canvas.width / LANES) * b.lane + (LANE_WIDTH - BARRIER_WIDTH) / 2;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(laneX, b.y, BARRIER_WIDTH, BARRIER_HEIGHT);

      // Collision
      const carX = (canvas.width / LANES) * gameState.carLane + (LANE_WIDTH - CAR_WIDTH) / 2;
      const carY = canvas.height - CAR_HEIGHT - 50;

      if (
        !b.passed &&
        b.y + BARRIER_HEIGHT > carY &&
        b.y < carY + CAR_HEIGHT &&
        Math.abs(carX - laneX) < (CAR_WIDTH + BARRIER_WIDTH) / 2
      ) {
        eventBus.publish({ type: 'CRASH' });
        b.passed = true; // Prevent multiple triggers
      }

      // Score
      if (!b.passed && b.y > carY + CAR_HEIGHT) {
        b.passed = true;
        scoreRef.current += 10;
        eventBus.publish({ type: 'BARRIER_PASSED', score: scoreRef.current });
      }

      return b.y < canvas.height + BARRIER_HEIGHT;
    });

    // Draw car
    const carX = (canvas.width / LANES) * gameState.carLane + (LANE_WIDTH - CAR_WIDTH) / 2;
    const carY = canvas.height - CAR_HEIGHT - 50;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.carLane, gameState.phase]);

  useEffect(() => {
    if (gameState.phase === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameLoop, gameState.phase]);

  // ========================
  // EVENT LISTENERS (Event-Driven)
  // ========================

  useEffect(() => {
    const handleCrash = async () => {
      setGameState((s) => ({ ...s, phase: 'crashed' }));
      const challenge = await fetchHeartChallenge();
      setGameState((s) => ({ ...s, challenge }));
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
    };

    const handleHeartWrong = () => {
      setGameState((s) => ({ ...s, phase: 'gameover' }));
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
    };

    eventBus.subscribe((e) => {
      if (e.type === 'CRASH') handleCrash();
      if (e.type === 'BARRIER_PASSED') handleBarrierPassed(e);
      if (e.type === 'HEART_ANSWER_CORRECT') handleHeartCorrect();
      if (e.type === 'HEART_ANSWER_WRONG') handleHeartWrong();
      if (e.type === 'RESTART') handleRestart();
    });

    return () => {};
  }, []);

  // ========================
  // START GAME
  // ========================

  const startGame = () => {
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
  };

  // ========================
  // HEART CHALLENGE SUBMIT
  // ========================

  const submitHeartAnswer = () => {
    const answer = parseInt(gameState.userAnswer);
    if (answer === gameState.challenge?.solution) {
      eventBus.publish({ type: 'HEART_ANSWER_CORRECT' });
    } else {
      eventBus.publish({ type: 'HEART_ANSWER_WRONG' });
    }
  };

  // ========================
  // RENDER
  // ========================

  if (!isLoggedIn) return null;

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
          <p className="text-xl font-bold text-white">Score: <span className="text-red-400">{gameState.score}</span></p>
        </div>
      )}

      {/* Ready Modal */}
      {gameState.phase === 'ready' && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              Heart Drive
            </h1>
            <p className="text-2xl text-gray-300 mb-8">Use ← → to dodge barriers!</p>
            <button
              onClick={startGame}
              className="group inline-flex items-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-full hover:from-red-500 hover:to-pink-500 transform hover:scale-110 transition-all shadow-xl"
            >
              <Play className="mr-3 group-hover:animate-pulse" size={28} />
              PLAY
            </button>
          </div>
        </div>
      )}

      {/* Game Canvas */}
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
      {gameState.phase === 'crashed' && gameState.challenge && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-3xl font-bold text-white mb-4">Crash! Count the Hearts!</h2>
            <img
              src={gameState.challenge.imageUrl}
              alt="Heart challenge"
              className="mx-auto mb-6 rounded-lg shadow-lg max-w-full h-auto"
            />
            <input
              type="number"
              value={gameState.userAnswer}
              onChange={(e) => setGameState((s) => ({ ...s, userAnswer: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && submitHeartAnswer()}
              placeholder="How many hearts?"
              className="w-full px-4 py-3 mb-4 bg-gray-700 text-white rounded-lg text-center text-xl"
              autoFocus
            />
            <button
              onClick={submitHeartAnswer}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-emerald-500 transition"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState.phase === 'gameover' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
            <h2 className="text-5xl font-bold text-red-500 mb-4">Game Over!</h2>
            <p className="text-2xl text-white mb-2">Final Score: <span className="text-yellow-400">{gameState.score}</span></p>
            <p className="text-lg text-gray-400 mb-8">Wrong heart count!</p>
            <button
              onClick={() => eventBus.publish({ type: 'RESTART' })}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full hover:from-blue-500 hover:to-indigo-500 transition shadow-lg"
            >
              <RotateCcw className="mr-2" />
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;