const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = sqlite3(path.join(dataDir, 'tictactoe.db'));

// Initialize database with tables
function initializeDatabase() {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_mode TEXT NOT NULL,
      player_x TEXT,
      player_o TEXT,
      player_x_user_id INTEGER,
      player_o_user_id INTEGER,
      winner TEXT,
      is_draw BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (player_x_user_id) REFERENCES users(id),
      FOREIGN KEY (player_o_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS game_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      player_symbol TEXT NOT NULL,
      position INTEGER NOT NULL,
      move_number INTEGER NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP,
      is_guest BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      games_lost INTEGER DEFAULT 0,
      games_drawn INTEGER DEFAULT 0,
      single_player_wins INTEGER DEFAULT 0,
      multiplayer_wins INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  
  // Add new columns to existing games table if they don't exist
  try {
    db.exec(`
      ALTER TABLE games ADD COLUMN player_x_user_id INTEGER;
    `);
  } catch (error) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`
      ALTER TABLE games ADD COLUMN player_o_user_id INTEGER;
    `);
  } catch (error) {
    // Column already exists, ignore
  }
  
  console.log('Database initialized successfully');
}

module.exports = {
  db,
  initializeDatabase
};