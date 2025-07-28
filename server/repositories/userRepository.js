const { db } = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// Create a new user
function createUser(userData) {
  const { username, email, password, displayName } = userData;
  
  // Hash the password
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name)
    VALUES (?, ?, ?, ?)
  `);
  
  try {
    const result = stmt.run(username, email || null, passwordHash, displayName || username);
    
    // Create initial user stats
    const statsStmt = db.prepare(`
      INSERT INTO user_stats (user_id)
      VALUES (?)
    `);
    statsStmt.run(result.lastInsertRowid);
    
    return result.lastInsertRowid;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
}

// Find user by username
function findUserByUsername(username) {
  const stmt = db.prepare(`
    SELECT * FROM users WHERE username = ?
  `);
  return stmt.get(username);
}

// Find user by email
function findUserByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `);
  return stmt.get(email);
}

// Find user by ID
function findUserById(id) {
  const stmt = db.prepare(`
    SELECT id, username, email, display_name, created_at, last_login_at, is_guest
    FROM users WHERE id = ?
  `);
  return stmt.get(id);
}

// Verify user password
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// Update last login time
function updateLastLogin(userId) {
  const stmt = db.prepare(`
    UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(userId);
}

// Get user statistics
function getUserStats(userId) {
  const stmt = db.prepare(`
    SELECT * FROM user_stats WHERE user_id = ?
  `);
  return stmt.get(userId);
}

// Update user statistics
function updateUserStats(userId, gameResult) {
  const { gameMode, winner, isDraw, userSymbol } = gameResult;
  
  const stmt = db.prepare(`
    UPDATE user_stats SET
      games_played = games_played + 1,
      games_won = games_won + ?,
      games_lost = games_lost + ?,
      games_drawn = games_drawn + ?,
      single_player_wins = single_player_wins + ?,
      multiplayer_wins = multiplayer_wins + ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);
  
  const isWin = winner === userSymbol ? 1 : 0;
  const isLoss = winner && winner !== userSymbol ? 1 : 0;
  const isDrawn = isDraw ? 1 : 0;
  const isSinglePlayerWin = gameMode === 'single' && isWin ? 1 : 0;
  const isMultiplayerWin = gameMode === 'multiplayer' && isWin ? 1 : 0;
  
  stmt.run(isWin, isLoss, isDrawn, isSinglePlayerWin, isMultiplayerWin, userId);
}

// Get user's game history
function getUserGameHistory(userId, limit = 10) {
  const stmt = db.prepare(`
    SELECT g.*, 
           CASE 
             WHEN g.player_x_user_id = ? THEN 'X'
             WHEN g.player_o_user_id = ? THEN 'O'
             ELSE NULL
           END as user_symbol
    FROM games g
    WHERE g.player_x_user_id = ? OR g.player_o_user_id = ?
    ORDER BY g.completed_at DESC
    LIMIT ?
  `);
  
  return stmt.all(userId, userId, userId, userId, limit);
}

// Update user profile
function updateUserProfile(userId, updates) {
  const { displayName, email } = updates;
  
  const stmt = db.prepare(`
    UPDATE users SET
      display_name = COALESCE(?, display_name),
      email = COALESCE(?, email)
    WHERE id = ?
  `);
  
  try {
    stmt.run(displayName, email, userId);
    return true;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

module.exports = {
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  verifyPassword,
  updateLastLogin,
  getUserStats,
  updateUserStats,
  getUserGameHistory,
  updateUserProfile
};