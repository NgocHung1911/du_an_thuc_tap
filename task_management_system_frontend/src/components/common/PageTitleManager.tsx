import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'Task Management System',
  '/login': 'Sign In',
  '/register': 'Register',
  '/verify-otp': 'Verify OTP',
  '/accept-invite': 'Accept Invite',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/projects': 'Project Management',
  '/admin/settings': 'Personal Profile',
  '/admin/profile': 'Personal Profile',
  '/member/my-tasks': 'My Tasks',
  '/member/projects': 'My Projects',
  '/member/profile': 'Profile',
};

export const PageTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Check exact path match
    if (routeTitles[path]) {
      document.title = routeTitles[path];
      return;
    }

    // Check dynamic project detail path match
    if (path.match(/^\/(admin\/projects|member\/projects|projects)\/\d+/)) {
      document.title = 'Project Details';
      return;
    }

    // Fallback default title
    document.title = 'Task Management System';
  }, [location]);

  return null;
};

export default PageTitleManager;
