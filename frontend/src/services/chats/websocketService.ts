import SockJS from "sockjs-client";
import Stomp from "stompjs";

class WebSocketService {
  private stompClient: any = null;
  private socket: any = null;

  private newMessageListeners: ((data: any) => void)[] = [];
  private readReceiptListeners: ((data: {
    conversationId: string;
    readerId: string;
  }) => void)[] = [];

  connect(url: string, token: string | null = null): void {
    if (this.isConnected()) return;

    this.socket = new SockJS(url);
    this.stompClient = Stomp.over(this.socket);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    this.stompClient.connect(headers, (frame: any) => {
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
    });
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
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log("WebSocket disconnected");
      });
      this.stompClient = null;
    }
  }

  isConnected(): boolean {
    return this.stompClient && this.stompClient.connected;
  }
}

const websocketService = new WebSocketService();
export default websocketService;

