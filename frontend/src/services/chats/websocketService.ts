// WebSocket Service - Real-time messaging

type EventCallback = (data?: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  private listeners: Map<string, EventCallback[]> = new Map();
  private newMessageCallback: ((data: any) => void) | null = null;
  private messageReadCallback: ((data: any) => void) | null = null;
  private isReconnecting: boolean = false;

  connect(url: string, token: string | null = null): void {
    this.url = url;
    this.token = token;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    // TODO: Implement WebSocket connection
    // For now, just mark as not connected
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopReconnecting();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  send(data: any): void {
    if (this.isConnected() && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  onNewMessage(callback: (data: any) => void): void {
    this.newMessageCallback = callback;
  }

  onMessageRead(callback: (data: any) => void): void {
    this.messageReadCallback = callback;
  }

  stopReconnecting(): void {
    this.isReconnecting = false;
    // TODO: Clear reconnect timer
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
