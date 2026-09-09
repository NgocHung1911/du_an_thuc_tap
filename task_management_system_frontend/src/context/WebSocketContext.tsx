import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { webSocketService, WebSocketEvent, EventCallback } from '../services/websocketService';

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  subscribeToProject: (projectId: number | string, callback: EventCallback) => () => void;
  subscribeToNotifications: (callback: EventCallback) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      webSocketService.connect(token, user?.username);
    } else {
      webSocketService.disconnect();
    }

    const unsubscribeState = webSocketService.onConnectionStateChange((connected, error) => {
      setIsConnected(connected);
      setConnectionError(error || null);
    });

    return () => {
      unsubscribeState();
    };
  }, [isAuthenticated, token, user?.username]);

  const subscribeToProject = useCallback((projectId: number | string, callback: EventCallback) => {
    return webSocketService.subscribeToProject(projectId, callback);
  }, []);

  const subscribeToNotifications = useCallback((callback: EventCallback) => {
    return webSocketService.subscribeToNotifications(callback);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        connectionError,
        subscribeToProject,
        subscribeToNotifications,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
