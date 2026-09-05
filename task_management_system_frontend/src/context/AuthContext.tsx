import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserInfo {
  username: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  roles: string[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  login: (token: string, userData: { username: string; email: string; roles: string[]; fullName?: string }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [roles, setRoles] = useState<string[]>(() => {
    const savedRoles = localStorage.getItem('roles');
    return savedRoles ? JSON.parse(savedRoles) : [];
  });

  const [loading, setLoading] = useState<boolean>(false);

  const isAuthenticated = Boolean(token && user);
  const isAdmin = roles.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN');
  const isMember = roles.some(r => r === 'ROLE_MEMBER' || r === 'MEMBER');

  const login = (newToken: string, userData: { username: string; email: string; roles: string[] }) => {
    const userObj = { username: userData.username, email: userData.email };
    setToken(newToken);
    setUser(userObj);
    setRoles(userData.roles);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem('roles', JSON.stringify(userData.roles));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRoles([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        isAuthenticated,
        isAdmin,
        isMember,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
