import SockJS from "sockjs-client";
import Stomp from "stompjs";

type WsPayload = Record<string, unknown>;

interface StompFrame {
  headers: Record<string, string>;
}

interface StompMessage {
  body?: string;
}

interface StompSubscription {
  unsubscribe: () => void;
}

interface StompClientLike {
  connected: boolean;
  connect: (
    headers: Record<string, string>,
    onConnect: (frame: StompFrame) => void,
    onError: () => void,
  ) => void;
  subscribe: (
    destination: string,
    callback: (message: StompMessage) => void,
  ) => StompSubscription;
  send: (destination: string, headers: Record<string, string>, body: string) => void;
  disconnect: (callback: () => void) => void;
}

interface SockJsLike {
  onclose: (() => void) | null;
}

const resolveWsUrl = (): string => {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim();
  }

  const apiBase = import.meta.env.VITE_API_URL;
  if (apiBase && String(apiBase).trim()) {
    return `${String(apiBase).replace(/\/+$/, "")}/ws`;
  }

  return "http://localhost:8080/ws";
};

class WebSocketService {
  private stompClient: StompClientLike | null = null;
  private socket: SockJsLike | null = null;
  private reconnectTimer: number | null = null;
  private lastUrl: string | null = null;
  private lastToken: string | null = null;
  private isConnecting = false;

  private newMessageListeners: ((data: WsPayload) => void)[] = [];
  private readReceiptListeners: ((data: {
    conversationId: string;
    readerId: string;
  }) => void)[] = [];
  private topicListeners: Record<string, ((data: WsPayload) => void)[]> = {};
  private topicSubscriptions: Record<string, StompSubscription> = {};
  private pendingMessages: { destination: string; payload: WsPayload }[] = [];

  connect(url: string, token: string | null = null): void {
    if (this.isConnected() || this.isConnecting) return;

    if (!token) {
      return;
    }

    this.isConnecting = true;

    this.lastUrl = url;
    this.lastToken = token;

    this.socket = new SockJS(url) as SockJsLike;
    this.stompClient = Stomp.over(this.socket as unknown as WebSocket) as StompClientLike;

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    this.stompClient.connect(
      headers,
      (frame: StompFrame) => {
        this.isConnecting = false;
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        console.log(
          " WebSocket connected, principal:",
          frame.headers["user-name"],
        );

        this.stompClient?.subscribe("/user/queue/messages", (message: StompMessage) => {
          if (message.body) {
            const data = JSON.parse(message.body) as WsPayload;
            this.newMessageListeners.forEach((callback) => callback(data));
          }
        });

        this.stompClient?.subscribe("/user/queue/read-receipt", (message: StompMessage) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            this.readReceiptListeners.forEach((callback) => callback(data));
          }
        });

        Object.keys(this.topicListeners).forEach((topic) => {
          this.subscribeTopicInternal(topic);
        });

        if (this.pendingMessages.length > 0) {
          const queue = [...this.pendingMessages];
          this.pendingMessages = [];
          queue.forEach((item) => {
            this.send(item.destination, item.payload);
          });
        }
      },
      () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      },
    );

    if (this.socket) {
      this.socket.onclose = () => {
        this.scheduleReconnect();
      };
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    const reconnectUrl =
      this.lastUrl || resolveWsUrl();
    const reconnectToken = localStorage.getItem("accessToken") || this.lastToken;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected()) {
        this.connect(reconnectUrl, reconnectToken);
      }
    }, 2000);
  }

  private subscribeTopicInternal(topic: string): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    if (this.topicSubscriptions[topic]) {
      return;
    }

    this.topicSubscriptions[topic] = this.stompClient.subscribe(
      topic,
      (message: StompMessage) => {
        if (!message.body) {
          return;
        }

        const data = JSON.parse(message.body) as WsPayload;
        (this.topicListeners[topic] || []).forEach((callback) => callback(data));
      },
    );
  }

  onTopicMessage(topic: string, callback: (data: WsPayload) => void) {
    if (!this.topicListeners[topic]) {
      this.topicListeners[topic] = [];
    }

    this.topicListeners[topic].push(callback);

    if (!this.isConnected()) {
      const wsUrl = this.lastUrl || resolveWsUrl();
      const token = this.lastToken || localStorage.getItem("accessToken");
      this.connect(wsUrl, token);
    }

    this.subscribeTopicInternal(topic);

    return () => {
      this.topicListeners[topic] = (this.topicListeners[topic] || []).filter(
        (listener) => listener !== callback,
      );

      if ((this.topicListeners[topic] || []).length === 0) {
        delete this.topicListeners[topic];
        if (this.topicSubscriptions[topic]) {
          this.topicSubscriptions[topic].unsubscribe();
          delete this.topicSubscriptions[topic];
        }
      }
    };
  }

  send(destination: string, payload: WsPayload): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(payload));
      return;
    }

    this.pendingMessages.push({ destination, payload });
    this.ensureConnected();
  }

  ensureConnected(): void {
    if (this.isConnected()) {
      return;
    }

    const wsUrl = this.lastUrl || resolveWsUrl();
    const token = localStorage.getItem("accessToken") || this.lastToken;
    this.connect(wsUrl, token);
  }

  onNewMessage(callback: (data: WsPayload) => void) {
    this.newMessageListeners.push(callback);
    return () => {
      this.newMessageListeners = this.newMessageListeners.filter(
        (l) => l !== callback,
      );
    };
  }

  onReadReceipt(
    callback: (data: { conversationId: string; readerId: string }) => void,
  ) {
    this.readReceiptListeners.push(callback);
    return () => {
      this.readReceiptListeners = this.readReceiptListeners.filter(
        (l) => l !== callback,
      );
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log("WebSocket disconnected");
      });
      this.stompClient = null;
    }
    this.isConnecting = false;
    this.socket = null;
    this.topicSubscriptions = {};
    this.pendingMessages = [];
  }

  isConnected(): boolean {
    return Boolean(this.stompClient && this.stompClient.connected);
  }
}

const websocketService = new WebSocketService();
export default websocketService;

