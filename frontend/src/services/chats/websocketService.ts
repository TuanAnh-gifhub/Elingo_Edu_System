import SockJS from "sockjs-client";
import Stomp from "stompjs";

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
  private stompClient: any = null;
  private socket: any = null;
  private reconnectTimer: number | null = null;
  private lastUrl: string | null = null;
  private lastToken: string | null = null;

  private newMessageListeners: ((data: any) => void)[] = [];
  private readReceiptListeners: ((data: {
    conversationId: string;
    readerId: string;
  }) => void)[] = [];
  private topicListeners: Record<string, ((data: any) => void)[]> = {};
  private topicSubscriptions: Record<string, any> = {};

  connect(url: string, token: string | null = null): void {
    if (this.isConnected()) return;

    this.lastUrl = url;
    this.lastToken = token;

    this.socket = new SockJS(url);
    this.stompClient = Stomp.over(this.socket);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    this.stompClient.connect(
      headers,
      (frame: any) => {
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        console.log(
          "✅ WebSocket connected, principal:",
          frame.headers["user-name"],
        );

        this.stompClient.subscribe("/user/queue/messages", (message: any) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            this.newMessageListeners.forEach((callback) => callback(data));
          }
        });

        this.stompClient.subscribe("/user/queue/read-receipt", (message: any) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            this.readReceiptListeners.forEach((callback) => callback(data));
          }
        });

        Object.keys(this.topicListeners).forEach((topic) => {
          this.subscribeTopicInternal(topic);
        });
      },
      () => {
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
    const reconnectToken = this.lastToken || localStorage.getItem("accessToken");

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
      (message: any) => {
        if (!message.body) {
          return;
        }

        const data = JSON.parse(message.body);
        (this.topicListeners[topic] || []).forEach((callback) => callback(data));
      },
    );
  }

  onTopicMessage(topic: string, callback: (data: any) => void) {
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

  send(destination: string, payload: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(payload));
    }
  }

  onNewMessage(callback: (data: any) => void) {
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
    this.socket = null;
    this.topicSubscriptions = {};
  }

  isConnected(): boolean {
    return this.stompClient && this.stompClient.connected;
  }
}

const websocketService = new WebSocketService();
export default websocketService;

