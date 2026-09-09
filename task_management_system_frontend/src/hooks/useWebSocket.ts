import { useEffect } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { EventCallback } from '../services/websocketService';

export const useWebSocket = () => {
  return useWebSocketContext();
};

export const useProjectWebSocket = (projectId: number | string | undefined | null, callback: EventCallback) => {
  const { subscribeToProject, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProject(projectId, callback);
    return () => {
      unsubscribe();
    };
  }, [projectId, callback, subscribeToProject]);

  return { isConnected };
};

export const useNotificationWebSocket = (callback: EventCallback) => {
  const { subscribeToNotifications, isConnected } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(callback);
    return () => {
      unsubscribe();
    };
  }, [callback, subscribeToNotifications]);

  return { isConnected };
};
