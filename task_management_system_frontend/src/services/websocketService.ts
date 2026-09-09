if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type WebSocketEventType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_PRIORITY_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_DELETED'
  | 'COMMENT_CREATED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_REMOVED'
  | 'PROJECT_MEMBER_UPDATED'
  | 'PROJECT_MEMBER_ROLE_UPDATED'
  | 'NOTIFICATION_CREATED';

export interface WebSocketEvent {
  eventType?: WebSocketEventType;
  type?: WebSocketEventType;
  projectId?: number;
  taskId?: number;
  commentId?: number;
  recipientUsername?: string;
  senderUsername?: string;
  actorUsername?: string;
  actorFullName?: string;
  timestamp?: number | string;
  data?: any;
  payload?: any;
}

export type EventCallback = (event: WebSocketEvent) => void;
export type ConnectionStateCallback = (connected: boolean, error?: string) => void;

class WebSocketService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private connectionStateListeners: Set<ConnectionStateCallback> = new Set();
  private projectSubscriptions: Map<string, StompSubscription> = new Map();
  private projectCallbacks: Map<string, Set<EventCallback>> = new Map();
  private userNotificationSubscription: StompSubscription | null = null;
  private userNotificationCallbacks: Set<EventCallback> = new Set();
  private currentUsername: string | null = null;

  public connect(token: string, username?: string): void {
    if (this.client && (this.client.active || this.client.connected)) {
      return;
    }

    this.currentUsername = username || null;
    const socketUrl = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:8080/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        token: token,
      },
      debug: (str) => {
        if ((import.meta as any).env?.DEV) {
          console.debug('[STOMP]', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('WebSocket connected successfully:', frame);
      this.isConnected = true;
      this.notifyConnectionState(true);

      // Resubscribe active projects after reconnection
      this.projectCallbacks.forEach((callbacks, topic) => {
        if (callbacks.size > 0 && !this.projectSubscriptions.has(topic)) {
          this.subscribeToTopic(topic);
        }
      });

      // Resubscribe notification queue
      if (this.userNotificationCallbacks.size > 0 && !this.userNotificationSubscription) {
        this.subscribeToUserNotificationsInternal();
      }
    };

    this.client.onStompError = (frame) => {
      const msg = frame.headers['message'] || '';
      console.error('STOMP error:', msg, frame.body);
      this.isConnected = false;
      this.notifyConnectionState(false, msg || 'STOMP error');

      // Deactivate client on Unauthorized / Invalid JWT token to stop continuous reconnect loops
      if (msg.includes('Unauthorized') || msg.includes('Invalid JWT') || msg.includes('Forbidden')) {
        console.warn('Authentication error detected on WebSocket. Deactivating client connection.');
        this.disconnect();
      }
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket connection error:', event);
      this.isConnected = false;
      this.notifyConnectionState(false, 'WebSocket connection error');
    };

    this.client.onWebSocketClose = () => {
      console.warn('WebSocket connection closed');
      this.isConnected = false;
      this.notifyConnectionState(false, 'Connection closed');
      this.clearSubscriptions();
    };

    this.client.activate();
  }

  public disconnect(): void {
    if (this.client) {
      this.clearSubscriptions();
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.notifyConnectionState(false);
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.connectionStateListeners.delete(callback);
    };
  }

  private notifyConnectionState(connected: boolean, error?: string): void {
    this.connectionStateListeners.forEach((listener) => listener(connected, error));
  }

  private clearSubscriptions(): void {
    this.projectSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {}
    });
    this.projectSubscriptions.clear();

    if (this.userNotificationSubscription) {
      try {
        this.userNotificationSubscription.unsubscribe();
      } catch (e) {}
      this.userNotificationSubscription = null;
    }
  }

  public subscribeToProject(projectId: number | string, callback: EventCallback): () => void {
    const topic = `/topic/projects/${projectId}`;

    if (!this.projectCallbacks.has(topic)) {
      this.projectCallbacks.set(topic, new Set());
    }
    const callbacks = this.projectCallbacks.get(topic)!;
    callbacks.add(callback);

    if (this.isConnected && !this.projectSubscriptions.has(topic)) {
      this.subscribeToTopic(topic);
    }

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        const sub = this.projectSubscriptions.get(topic);
        if (sub) {
          try {
            sub.unsubscribe();
          } catch (e) {}
          this.projectSubscriptions.delete(topic);
        }
        this.projectCallbacks.delete(topic);
      }
    };
  }

  private subscribeToTopic(topic: string): void {
    if (!this.client || !this.isConnected) return;

    try {
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const event: WebSocketEvent = JSON.parse(message.body);
          const callbacks = this.projectCallbacks.get(topic);
          if (callbacks) {
            callbacks.forEach((cb) => cb(event));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message body:', err);
        }
      });
      this.projectSubscriptions.set(topic, sub);
    } catch (err) {
      console.error(`Failed to subscribe to topic ${topic}:`, err);
    }
  }

  public subscribeToNotifications(callback: EventCallback): () => void {
    this.userNotificationCallbacks.add(callback);

    if (this.isConnected && !this.userNotificationSubscription) {
      this.subscribeToUserNotificationsInternal();
    }

    return () => {
      this.userNotificationCallbacks.delete(callback);
      if (this.userNotificationCallbacks.size === 0 && this.userNotificationSubscription) {
        try {
          this.userNotificationSubscription.unsubscribe();
        } catch (e) {}
        this.userNotificationSubscription = null;
      }
    };
  }

  private subscribeToUserNotificationsInternal(): void {
    if (!this.client || !this.isConnected) return;

    try {
      const sub = this.client.subscribe('/user/queue/notifications', (message) => {
        try {
          const event: WebSocketEvent = JSON.parse(message.body);
          this.userNotificationCallbacks.forEach((cb) => cb(event));
        } catch (err) {
          console.error('Failed to parse user notification WebSocket message:', err);
        }
      });
      this.userNotificationSubscription = sub;
    } catch (err) {
      console.error('Failed to subscribe to user notifications queue:', err);
    }
  }
}

export const webSocketService = new WebSocketService();
