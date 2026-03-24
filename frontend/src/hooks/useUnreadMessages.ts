import { useState, useEffect } from "react";
import chatService from "../services/chats/chatService";
import type {
  ConversationResponse,
  ApiResponse,
} from "../services/chats/chatService";

interface UseUnreadMessagesReturn {
  unreadMessages: ConversationResponse[];
  unreadCount: number;
}

export const useUnreadMessages = (
  pollInterval: number = 10000,
): UseUnreadMessagesReturn => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<ConversationResponse[]>(
    [],
  );

  useEffect(() => {
    const getCurrentUserId = (): string | null => {
      try {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          const user = JSON.parse(userInfo) as { userId: string };
          return user.userId;
        }
      } catch (error) {
        console.error("Error parsing userInfo:", error);
      }
      return null;
    };

    const fetchUnreadCount = async () => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setUnreadCount(0);
        setUnreadMessages([]);
        return;
      }

      try {
        const response: ApiResponse<ConversationResponse[]> =
          await chatService.getUserConversations(currentUserId);

        const conversations = response.result ?? [];

        let count = 0;
        const unread: ConversationResponse[] = [];

        for (const conv of conversations) {
          if (conv.lastMessage && conv.isRead === false) {
            count += 1;
            unread.push(conv);
          }
        }

        setUnreadCount(count);
        setUnreadMessages(unread);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
        setUnreadCount(0);
        setUnreadMessages([]);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Poll for unread messages
    const interval = setInterval(fetchUnreadCount, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [pollInterval]);

  return {
    unreadMessages,
    unreadCount,
  };
};
