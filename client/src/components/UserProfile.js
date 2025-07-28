import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile, getUserStats, error, clearError } = useAuth();
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadUserStats();
      setEditData({
        displayName: user.displayName || '',
        email: user.email || ''
      });
    }
  }, [isOpen, user]);

  const loadUserStats = async () => {
    const userStats = await getUserStats();
    setStats(userStats);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    const result = await updateProfile(editData);
    
    if (result.success) {
      setIsEditing(false);
    }
    
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateWinRate = () => {
    if (!stats || stats.games_played === 0) return 0;
    return Math.round((stats.games_won / stats.games_played) * 100);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Profile</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="profile-section">
            <h3>Account Information</h3>
            
            {!isEditing ? (
              <div className="profile-info">
                <div className="info-row">
                  <label>Username:</label>
                  <span>{user.username}</span>
                </div>
                <div className="info-row">
                  <label>Display Name:</label>
                  <span>{user.displayName || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <label>Email:</label>
                  <span>{user.email || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <label>Member Since:</label>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                <div className="info-row">
                  <label>Last Login:</label>
                  <span>{formatDate(user.lastLoginAt)}</span>
                </div>
                
                <button 
                  className="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="edit-profile-form">
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={editData.displayName}
                    onChange={handleInputChange}
                    placeholder="How others will see you"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      clearError();
                      setEditData({
                        displayName: user.displayName || '',
                        email: user.email || ''
                      });
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {stats && (
            <div className="profile-section">
              <h3>Game Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.games_played}</div>
                  <div className="stat-label">Games Played</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.games_won}</div>
                  <div className="stat-label">Games Won</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.games_lost}</div>
                  <div className="stat-label">Games Lost</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.games_drawn}</div>
                  <div className="stat-label">Games Drawn</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{calculateWinRate()}%</div>
                  <div className="stat-label">Win Rate</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.single_player_wins}</div>
                  <div className="stat-label">AI Wins</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.multiplayer_wins}</div>
                  <div className="stat-label">Multiplayer Wins</div>
                </div>
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;