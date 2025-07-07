
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { 
  FileText, 
  Users, 
  BarChart3, 
  CreditCard,
  Settings,
  LogOut,
  BarChart3 as Logo
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Questionnaires',
    url: '/dashboard/questionnaires',
    icon: FileText,
  },
  {
    title: 'Population',
    url: '/dashboard/population',
    icon: Users,
  },
  {
    title: 'Surveys',
    url: '/dashboard/surveys',
    icon: BarChart3,
  },
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: CreditCard,
    disabled: true,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
    disabled: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
            <Logo className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Servify
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild={!item.disabled}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                      ${location.pathname === item.url 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-900'}
                    `}
                  >
                    {item.disabled ? (
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
                          Soon
                        </span>
                      </div>
                    ) : (
                      <Link to={item.url} className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
