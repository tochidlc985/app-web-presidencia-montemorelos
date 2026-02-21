// src/services/realtimeService.ts
import { useEffect, useRef, useCallback } from 'react';

// Interfaz para los eventos de WebSocket
interface WebSocketEvent {
  type: 'reporte_created' | 'reporte_updated' | 'reporte_deleted' | 'user_updated' | 'connection';
  data?: any;
  timestamp: string;
}

// Interfaz para el servicio de tiempo real
interface RealtimeService {
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  isConnected: () => boolean;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
}

// Implementación del servicio de tiempo real
class RealtimeServiceImpl implements RealtimeService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;

  async connect(token: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.token = token;

    return new Promise((resolve, reject) => {
      try {
        // Construir la URL del WebSocket - usar HTTPS en producción
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws?token=${token}`;

        console.log('Conectando a WebSocket:', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connection', { status: 'connected' });
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketEvent = JSON.parse(event.data);
            console.log('WebSocket message received:', message);

            // Notificar a todos los listeners del evento
            const listeners = this.eventListeners.get(message.type) || [];
            listeners.forEach(callback => callback(message.data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.stopHeartbeat();
          this.emit('connection', { status: 'disconnected' });

          // Intentar reconectar
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            this.reconnectTimer = setTimeout(() => {
              this.connect(token);
            }, this.reconnectInterval);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.eventListeners.clear();
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: event,
        data,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Enviar heartbeat cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Crear una instancia única del servicio
const realtimeService = new RealtimeServiceImpl();

// Hook para usar el servicio de tiempo real en componentes React
export const useRealtime = () => {
  const serviceRef = useRef<RealtimeService>(realtimeService);

  const connect = useCallback(async (token: string) => {
    await serviceRef.current.connect(token);
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current.disconnect();
  }, []);

  const isConnected = useCallback(() => {
    return serviceRef.current.isConnected();
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    serviceRef.current.on(event, callback);

    // Devolver función de limpieza
    return () => {
      serviceRef.current.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    serviceRef.current.emit(event, data);
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    on,
    emit
  };
};

// Exportar la instancia del servicio para uso directo
export default realtimeService;
