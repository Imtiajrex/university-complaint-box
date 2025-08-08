import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart, Settings, HelpCircle, User as UserIcon } from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  
  const navigationItems = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      forRoles: ['student', 'admin']
    },
    {
      name: 'Submit Complaint',
      to: '/new-complaint',
      icon: <FileText className="w-5 h-5" />,
      forRoles: ['student']
    },
    {
      name: 'Analytics',
      to: '/analytics',
      icon: <BarChart className="w-5 h-5" />,
      forRoles: ['admin']
    },
    {
      name: 'Profile',
      to: '/profile',
      icon: <UserIcon className="w-5 h-5" />,
      forRoles: ['student', 'admin']
    },
    {
      name: 'Settings',
      to: '/settings',
      icon: <Settings className="w-5 h-5" />,
      forRoles: ['student', 'admin']
    },
    {
      name: 'Help',
      to: '/help',
      icon: <HelpCircle className="w-5 h-5" />,
      forRoles: ['student', 'admin']
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    item.forRoles.includes(user.role)
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) => `
                flex items-center px-4 py-2 text-sm font-medium rounded-md 
                transition-colors duration-150 ease-in-out
                ${isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
      
      <div className="px-3 pb-6">
        <div className="px-4 py-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-500">
            Logged in as:
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">
            {user.name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {isAdmin ? 'Administrator' : `Student (${user.studentId})`}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;