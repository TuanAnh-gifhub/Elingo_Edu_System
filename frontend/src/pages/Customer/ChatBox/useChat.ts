import { useState, useEffect, useRef } from "react";
import chatService from "../../../services/chats/chatService";
import websocketService from "../../../services/chats/websocketService";

export const useChat = (
  currentUserId: string | null,
  isChatActiveRef: React.MutableRefObject<boolean>,
) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  // 1. Thêm Ref để giữ selectedChat mới nhất mà không gây re-render useEffect
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async (showLoader = false) => {
    if (!currentUserId) return;

    if (showLoader) {
      setLoading(true);
    }
    try {
      const res = await chatService.getUserConversations(currentUserId);
      if (res.result && Array.isArray(res.result)) {
        const mapped = res.result.map((c: any) => {
          const isGroup = c.conversationType === "CLASS_GROUP";
          const other =
            !isGroup && c.user1?.userId === currentUserId ? c.user2 : c.user1;
          return {
            ...c,
            otherPerson: other
              ? { userId: other.userId, userName: other.userName }
              : null,
          };
        });

        const previewFallbackTargets = mapped.filter(
          (conv: any) =>
            conv.conversationId &&
            (!conv.lastMessage || !String(conv.lastMessage).trim()),
        );

        if (previewFallbackTargets.length > 0) {
          const fallbackResults = await Promise.all(
            previewFallbackTargets.map(async (conv: any) => {
              try {
                const history = await chatService.getMessages(conv.conversationId);
                const list = Array.isArray(history.result) ? history.result : [];
                const last = list.length > 0 ? list[list.length - 1] : null;
                const fallbackText =
                  last?.content && String(last.content).trim()
                    ? String(last.content)
                    : last?.imageUrl
                      ? "Đã gửi tệp đính kèm"
                      : null;

                return {
                  conversationId: conv.conversationId,
                  lastMessage: fallbackText,
                  lastSenderName: last?.senderName || conv.lastSenderName,
                };
              } catch {
                return {
                  conversationId: conv.conversationId,
                  lastMessage: conv.lastMessage,
                  lastSenderName: conv.lastSenderName,
                };
              }
            }),
          );

          const fallbackMap = new Map(
            fallbackResults.map((item) => [item.conversationId, item]),
          );

          const merged = mapped.map((conv: any) => {
            const fallback = fallbackMap.get(conv.conversationId);
            if (!fallback) {
              return conv;
            }

            return {
              ...conv,
              lastMessage:
                fallback.lastMessage && String(fallback.lastMessage).trim()
                  ? fallback.lastMessage
                  : conv.lastMessage,
              lastSenderName: fallback.lastSenderName || conv.lastSenderName,
            };
          });

          setConversations(merged);
        } else {
          setConversations(mapped);
        }

        if (!isInitialLoaded) {
          setIsInitialLoaded(true);
        }
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const scheduleConversationsRefresh = () => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      loadConversations(false);
    }, 800);
  };

  const upsertConversationPreview = (data: any, isWatchingChat: boolean) => {
    const incomingConvId = data?.conversationId ? String(data.conversationId) : null;
    if (!incomingConvId) {
      scheduleConversationsRefresh();
      return;
    }

    const senderId = String(data.senderId || "");
    const isMe = senderId === String(currentUserId || "");

    setConversations((prev) => {
      const index = prev.findIndex(
        (item) => String(item.conversationId) === incomingConvId,
      );

      if (index === -1) {
        // Unknown conversation (newly created on another client), do a background sync.
        scheduleConversationsRefresh();
        return prev;
      }

      const next = [...prev];
      const target = { ...next[index] };

      const previewText =
        data.content && String(data.content).trim()
          ? data.content
          : data.imageUrl
            ? "Đã gửi tệp đính kèm"
            : target.lastMessage;

      target.lastMessage = previewText;
      target.lastSenderName = data.senderName || target.lastSenderName;
      target.updatedAt = data.createdAt || new Date().toISOString();

      const isCurrentConversation =
        String(currentConversationIdRef.current || "") === incomingConvId;

      if (isMe) {
        target.isRead = true;
      } else {
        target.isRead = isCurrentConversation && isWatchingChat;
      }

      next.splice(index, 1);
      return [target, ...next];
    });
  };

  const loadMessages = async (id: string) => {
    currentConversationIdRef.current = id;
    const res = await chatService.getMessages(id);
    if (res.result && Array.isArray(res.result)) {
      const transformed = res.result.map((msg: any) => ({
        ...msg,
        sender: msg.senderId === currentUserId ? "user" : "other",
        isRead: msg.status === "READ",
      }));
      setMessages(transformed);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    websocketService.ensureConnected();
    loadConversations(!isInitialLoaded);

    const heartbeat = window.setInterval(() => {
      websocketService.ensureConnected();
    }, 5000);

    const unsubscribeNewMsg = websocketService.onNewMessage((data: any) => {
      const incomingConvId = data.conversationId
        ? String(data.conversationId)
        : null;
      const currentConvId = currentConversationIdRef.current
        ? String(currentConversationIdRef.current)
        : null;

      const currentSelectedChat = selectedChatRef.current;

      const isMatchID = currentConvId === incomingConvId;
      const isNewChatMatch =
        !currentConvId &&
        currentSelectedChat?.otherPerson?.userId &&
        (data.senderId === currentSelectedChat.otherPerson.userId ||
          data.recipientId === currentSelectedChat.otherPerson.userId);

      if (isMatchID || isNewChatMatch) {
        if (!currentConvId && incomingConvId) {
          currentConversationIdRef.current = incomingConvId;
          setSelectedChat((prev: any) => ({
            ...prev,
            conversationId: incomingConvId,
          }));
        }

        const isMe = data.senderId === currentUserId;
        const isWatchingChat = isChatActiveRef.current;

        const incoming = {
          ...data,
          messageId: data.messageId || `msg-${Date.now()}`,
          sender: isMe ? "user" : "other",
          isRead: isMe ? false : isWatchingChat,
          status: isMe ? "SENT" : isWatchingChat ? "READ" : "SENT",
        };

        setMessages((prev) => {
          const isExisting = prev.some(
            (m) => String(m.messageId) === String(incoming.messageId),
          );
          if (isExisting) return prev;

          const isMeMsg = String(data.senderId) === String(currentUserId);
          let tempRemoved = false;

          const newMessages = [...prev];
          for (let i = newMessages.length - 1; i >= 0; i--) {
            const m = newMessages[i];
            if (
              isMeMsg &&
              m.isOptimistic &&
              m.content === incoming.content &&
              !tempRemoved
            ) {
              newMessages.splice(i, 1);
              tempRemoved = true;
              break;
            }
          }

          return [...newMessages, incoming];
        });

        if (isWatchingChat && !isMe && incomingConvId) {
          chatService.markMessageAsRead(incomingConvId, currentUserId);
        }
      }

      upsertConversationPreview(data, isChatActiveRef.current);
    });

    const unsubscribeReadReceipt = websocketService.onReadReceipt(
      (data: any) => {
        if (
          String(currentConversationIdRef.current) ===
          String(data.conversationId)
        ) {
          setMessages((prev) =>
            prev.map((m) =>
              m.sender === "user" ? { ...m, isRead: true, status: "READ" } : m,
            ),
          );

          setConversations((prev) =>
            prev.map((conv) =>
              String(conv.conversationId) === String(data.conversationId)
                ? { ...conv, isRead: true }
                : conv,
            ),
          );
        }

        scheduleConversationsRefresh();
      },
    );

    return () => {
      unsubscribeNewMsg();
      unsubscribeReadReceipt();
      window.clearInterval(heartbeat);

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [currentUserId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedChat || !currentUserId) return;

    const isGroup = selectedChat.conversationType === "CLASS_GROUP";
    const recipientId = selectedChat.otherPerson?.userId;

    const targetConversationId =
      currentConversationIdRef.current || selectedChat.conversationId;

    if (!isGroup && !recipientId) {
      return;
    }

    if (selectedFiles.length > 0 && selectedFiles[0]) {
      try {
        const formData = new FormData();
        const messageData = {
          content: newMessage.trim(),
          recipientId: isGroup ? null : recipientId,
          conversationId: targetConversationId,
        };
        formData.append(
          "data",
          new Blob([JSON.stringify(messageData)], { type: "application/json" }),
        );

        if (selectedFiles[0].file) {
          formData.append("file", selectedFiles[0].file);
        }
        await chatService.sendMessageWithImage(formData);
        setNewMessage("");
        setSelectedFiles([]);
      } catch (err) {
        console.error("Lỗi gửi ảnh:", err);
      }
    } else {
      const content = newMessage.trim();
      websocketService.send("/app/chat", {
        senderId: currentUserId,
        recipientId: isGroup ? null : recipientId,
        content,
        conversationId: targetConversationId,
      });
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        messageId: tempId,
        senderId: currentUserId,
        conversationId: targetConversationId,
        sender: "user",
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
        status: "SENT",
        isOptimistic: true,
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
    }
  };

  const handleChatSelect = async (chat: any) => {
    // 4. Kiểm tra xem có thực sự đang click sang một người khác không
    const isChangingConversation =
      currentConversationIdRef.current !== chat.conversationId;

    setSelectedChat(chat);
    currentConversationIdRef.current = chat.conversationId;

    if (chat.conversationId) {
      // CHỈ load lại API nếu là cuộc hội thoại mới, tránh gọi API ghi đè tin nhắn đang chat
      if (isChangingConversation) {
        await loadMessages(chat.conversationId);
      }
      await chatService.markMessageAsRead(chat.conversationId, currentUserId!);
      setConversations((prev) =>
        prev.map((item) =>
          String(item.conversationId) === String(chat.conversationId)
            ? { ...item, isRead: true }
            : item,
        ),
      );
      scheduleConversationsRefresh();
    }
  };

  const handleDeleteConversationById = async (conversationId: string) => {
    if (!conversationId || deletingConversation) {
      return;
    }

    try {
      setDeletingConversation(true);
      setDeletingConversationId(conversationId);
      await chatService.deleteConversation(conversationId);

      setConversations((prev) =>
        prev.filter((item) => item.conversationId !== conversationId),
      );

      if (currentConversationIdRef.current === conversationId) {
        currentConversationIdRef.current = null;
        setSelectedChat(null);
        setMessages([]);
        setNewMessage("");
        setSelectedFiles([]);
      }
    } finally {
      setDeletingConversation(false);
      setDeletingConversationId(null);
      scheduleConversationsRefresh();
    }
  };

  const handleDeleteConversation = async () => {
    const conversationId = selectedChat?.conversationId;
    if (!conversationId) {
      return;
    }

    await handleDeleteConversationById(conversationId);
  };

  return {
    conversations,
    messages,
    selectedChat,
    setSelectedChat,
    setMessages,
    newMessage,
    setNewMessage,
    selectedFiles,
    setSelectedFiles,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    loading,
    deletingConversation,
    deletingConversationId,
    messagesEndRef,
    handleSendMessage,
    handleChatSelect,
    handleDeleteConversation,
    handleDeleteConversationById,
  };
};
