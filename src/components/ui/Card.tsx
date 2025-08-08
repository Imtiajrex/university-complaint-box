import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className || ''}`}>
      {children}
    </div>
  );
};

type CardHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className || ''}`}>
      {children}
    </div>
  );
};

type CardContentProps = {
  children: React.ReactNode;
  className?: string;
};

const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={`px-6 py-4 ${className || ''}`}>
      {children}
    </div>
  );
};

type CardFooterProps = {
  children: React.ReactNode;
  className?: string;
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${className || ''}`}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter };