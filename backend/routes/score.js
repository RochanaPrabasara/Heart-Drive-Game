const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Save/Update score
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    const userId = req.user;

    let userScore = await Score.findOne({ userId });
    const user = await User.findById(userId);

    if (!userScore) {
      userScore = new Score({
        userId,
        username: user.username,
        score,
        gamesPlayed: 1
      });
    } else {
      userScore.score = Math.max(userScore.score, score);
      userScore.gamesPlayed += 1;
    }

    await userScore.save();

    // Update user high score
    if (score > user.highScore) {
      user.highScore = score;
      await user.save();
    }

    res.json({ 
      success: true, 
      highScore: userScore.score,
      gamesPlayed: userScore.gamesPlayed 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save score' });
  }
});

// Get user stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const userScore = await Score.findOne({ userId }).sort({ score: -1 });
    const user = await User.findById(userId);

    res.json({
      username: user.username,
      highScore: userScore?.score || 0,
      gamesPlayed: userScore?.gamesPlayed || 0,
      rank: await getUserRank(userId)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

// Get leaderboard (top 10)
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Score.find()
      .sort({ score: -1 })
      .limit(10)
      .select('username score gamesPlayed')
      .lean();

    // Add rank
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      rank: index + 1,
      username: player.username,
      score: player.score,
      gamesPlayed: player.gamesPlayed
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
});

// Helper function to calculate user rank
async function getUserRank(userId) {
  const userScore = await Score.findOne({ userId }).sort({ score: -1 });
  if (!userScore) return null;

  const higherScores = await Score.countDocuments({ 
    score: { $gt: userScore.score } 
  });
  return higherScores + 1;
}

module.exports = router;