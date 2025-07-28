import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, error, clearError } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      let result;
      if (isLogin) {
        result = await login({
          username: formData.username,
          password: formData.password
        });
      } else {
        result = await register({
          username: formData.username,
          email: formData.email || undefined,
          password: formData.password,
          displayName: formData.displayName || undefined
        });
      }

      if (result.success) {
        onClose();
        setFormData({
          username: '',
          email: '',
          password: '',
          displayName: ''
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setFormData({
      username: '',
      email: '',
      password: '',
      displayName: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="displayName">Display Name (optional)</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="How others will see you"
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email (optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              disabled={isLoading}
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="link-button" 
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="auth-note">
          <p><small>
            Authentication is optional. You can play without an account, 
            but signing up lets you track your statistics and game history.
          </small></p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;