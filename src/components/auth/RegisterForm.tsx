import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { allDepartments, getDepartmentLabel } from '../../data/mockData';

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [department, setDepartment] = useState(allDepartments[0]);
  const [studentId, setStudentId] = useState('');
  
  // Form validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [studentIdError, setStudentIdError] = useState('');
  
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setStudentIdError('');

    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }

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

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    // Validate student ID if role is student
    if (role === 'student' && !studentId.trim()) {
      setStudentIdError('Student ID is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await register(name, email, password, role, department, role === 'student' ? studentId : undefined);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your full name"
        error={nameError}
        required
      />

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
        placeholder="Create a password"
        error={passwordError}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        error={confirmPasswordError}
        required
      />

      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as 'student' | 'admin')}
        options={[
          { value: 'student', label: 'Student' },
          { value: 'admin', label: 'Administrator' }
        ]}
      />

      <Select
        label="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value as any)}
        options={allDepartments.map(dept => ({ 
          value: dept, 
          label: getDepartmentLabel(dept)
        }))}
      />

      {role === 'student' && (
        <Input
          label="Student ID"
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter your student ID"
          error={studentIdError}
          required={role === 'student'}
        />
      )}

      <div className="pt-2">
        <Button type="submit" isLoading={isLoading}>
          Register
        </Button>
      </div>

      <p className="text-sm text-center">
        Already have an account?{' '}
        <button 
          type="button"
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          Log in
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;