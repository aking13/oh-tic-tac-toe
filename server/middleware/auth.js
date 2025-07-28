// Optional authentication middleware - endpoints work with or without auth
function optionalAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username,
      displayName: req.session.displayName
    };
  } else {
    req.user = null;
  }
  next();
}

// Required authentication middleware - endpoints require auth
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = {
    id: req.session.userId,
    username: req.session.username,
    displayName: req.session.displayName
  };
  next();
}

// Validation helpers
function validateRegistration(req, res, next) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Basic username validation (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }
  
  next();
}

function validateLogin(req, res, next) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  next();
}

module.exports = {
  optionalAuth,
  requireAuth,
  validateRegistration,
  validateLogin
};