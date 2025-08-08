import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Menu, X, MessageSquare } from 'lucide-react';
import { User as UserType } from '../../types';

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                UniComplaint
              </span>
            </Link>
          </div>
          
          <div className="hidden sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              {user.role === 'student' ? (
                <Link 
                  to="/new-complaint" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Submit New Complaint
                </Link>
              ) : (
                <span className="px-3 py-2 rounded-md text-sm font-medium text-white bg-teal-600">
                  Admin Dashboard
                </span>
              )}
              
              <div className="border-l border-gray-300 h-6 mx-2"></div>
              
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full p-1">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-4 space-y-1">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full p-1">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            
            {user.role === 'student' && (
              <Link 
                to="/new-complaint" 
                className="block px-4 py-2 text-base font-medium text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Submit New Complaint
              </Link>
            )}

            <Link 
              to="/dashboard" 
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;