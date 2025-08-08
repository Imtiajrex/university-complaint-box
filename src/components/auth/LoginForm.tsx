import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the AuthContext
    }
  };

  // For demo purposes, provide quick access to sample accounts
  const fillDemoCredentials = (userType: 'student' | 'admin') => {
    if (userType === 'student') {
      setEmail('student@example.com');
      setPassword('password');
    } else {
      setEmail('admin@example.com');
      setPassword('password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        error={emailError}
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        error={passwordError}
        required
      />

      <div className="flex flex-col space-y-2">
        <Button type="submit" isLoading={isLoading}>
          Log In
        </Button>

        <div className="mt-4">
          <p className="text-sm text-center text-gray-600 mb-2">Demo Accounts</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => fillDemoCredentials('student')}
              type="button"
            >
              Student Demo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => fillDemoCredentials('admin')}
              type="button"
            >
              Admin Demo
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-center">
        Don't have an account?{' '}
        <button 
          type="button"
          onClick={() => navigate('/register')}
          className="text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          Create an account
        </button>
      </p>
    </form>
  );
};

export default LoginForm;