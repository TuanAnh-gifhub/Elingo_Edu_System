import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaCommentDots, FaUser } from "react-icons/fa";
import ChatList from "./ChatList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";

import { 
  getUserConversations, 
  getMessages, 
  sendMessage, 
  // createConversation, // Not used in template mode
  getConversation,
  markMessageAsRead
} from "../../../services/chats/chatService";

import websocketService from "../../../services/chats/websocketService";

import { tokenService } from "../../../services/auth/tokenService";

import { 
  // uploadToCloudinary, // Not used in template mode 
  uploadMultipleFiles,
  createMediaMessageContent 
} from "../../../services/upload/uploadService";

// ============ TYPE DEFINITIONS ============

interface WebSocketMessageData {
  id?: string | number;
  conversationId?: string;
  content?: string;
  createdAt?: string;
  sender?: 'user' | 'other';
  senderId?: string;
  type?: string;
  payload?: {
    conversationId?: string;
    content?: string;
    createdAt?: string;
    sender?: 'user' | 'other';
    senderId?: string;
    id?: string | number;
  };
  message?: {
    content?: string;
    createdAt?: string;
    sender?: 'user' | 'other';
    senderId?: string;
    id?: string | number;
  };
}

interface User {
  userId: string;
  fullName?: string;
  avatar?: string;
}

interface Conversation {
  conversationId: string;
  lastMessage?: string;
  updatedAt?: string;
  seller?: User;
  buyer?: User;
  listing?: {
    item?: {
      title?: string;
    };
  };
  name?: string;
  avatar?: string;
  time?: string;
  isRead?: boolean;
  isOnline?: boolean;
  lastActive?: string;
  type?: string;
  currentUserId?: string;
  otherPerson?: User;
}

interface Chat {
  id: string;
  conversationId: string;
  name: string;
  lastMessage: string;
  time: string;
  isRead: boolean;
  avatar: string;
  isOnline: boolean;
  lastActive: string;
  type: string;
  listing?: Conversation['listing'];
  seller?: User;
  buyer?: User;
  currentUserId?: string;
  otherPerson?: User;
  updatedAt?: string;
  memberCount?: number;
}

interface Message {
  id: string | number;
  sender: 'user' | 'other';
  content: string;
  time?: string;
  createdAt: string;
  isRead?: boolean;
  senderId?: string;
  isUploading?: boolean;
  isVoice?: boolean;
  files?: Array<{
    file: File;
    dataURL?: string;
  }>;
}

interface FileItem {
  file: File;
  dataURL?: string;
}

interface UploadResult {
  success: boolean;
  data: {
    resourceType: string;
    url: string;
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    duration?: number;
    thumbnail?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  messageId?: string;
  createdAt?: string;
}

// Extend Window interface for polling interval
declare global {
  interface Window {
    chatBoxPollingInterval?: ReturnType<typeof setInterval> | null;
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Generate avatar SVG with first letter and color
 */
const generateAvatarSVG = (name: string, userId: string | null = null): string => {
  const letter = name.charAt(0).toUpperCase();
  const color = userId 
    ? `hsl(${parseInt(userId.slice(0, 8), 16) % 360}, 70%, 60%)`
    : '#10b981';
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/><text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dy=".3em" font-family="Arial">${letter}</text></svg>`;
};

/**
 * Get display name and avatar from URL params or fallback
 */
const getInitialDisplayInfo = (
  sellerName: string | null, 
  buyerName: string | null, 
  fallbackName: string = 'Đang tải...'
): { name: string; avatar: string } => {
  if (sellerName && buyerName) {
    const name = decodeURIComponent(sellerName);
    return {
      name,
      avatar: generateAvatarSVG(name)
    };
  }
  
  return {
    name: fallbackName,
    avatar: generateAvatarSVG('?')
  };
};

const ChatBoxHome = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dark mode state synced with localStorage & Header event
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('landing_dark_mode');
    return stored === 'true';
  });

  useEffect(() => {
    const handleDarkModeChange = (event: CustomEvent<{ isDarkMode: boolean }>) => {
      setIsDarkMode(event.detail.isDarkMode);
    };
    window.addEventListener('darkModeChanged', handleDarkModeChange as EventListener);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange as EventListener);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const urlConversationLoaded = useRef<boolean>(false);
  const currentConversationIdRef = useRef<string | null>(null);

  // Get current user ID from localStorage
  // TEMPLATE MODE: Returns demo user ID if no user is logged in
  const getCurrentUserId = (): string | null => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo) as { userId: string };
        return user.userId;
      }
    } catch (error) {
      console.error('❌ Error parsing userInfo from localStorage:', error);
    }
    // TEMPLATE MODE: Return demo user ID for testing
    return 'currentUser';
  };
  
  const currentUserId = getCurrentUserId();
  
  // TEMPLATE MODE: Allow demo without login
  // TODO: Remove this check when connecting to real API
  // if (!currentUserId) {
  //   return (
  //     <div className="h-screen bg-gray-100 flex items-center justify-center">
  //       <div className="text-center">
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">Vui lòng đăng nhập</h2>
  //         <p className="text-gray-600 mb-6">Bạn cần đăng nhập để sử dụng tính năng chat</p>
  //         <button
  //           onClick={() => window.location.href = '/'}
  //           className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-lg transition-colors duration-300"
  //         >
  //           Về trang chủ
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
  
  // Get URL parameters
  const conversationId = searchParams.get('conversationId');
  const preset = searchParams.get('preset');
  const sellerName = searchParams.get('sellerName');
  const buyerName = searchParams.get('buyerName');

  // Load conversation name with loading state
  const loadConversationName = async (conversation: Conversation): Promise<Conversation> => {
    try {
      
      const response = await getConversation(conversation.conversationId) as ApiResponse<{ seller: User; buyer: User }>;
      
      if (response.success && response.data) {
        const { seller, buyer } = response.data;
        
        const otherPerson = seller?.userId === currentUserId ? buyer : seller;
        
        let otherPersonName = otherPerson?.fullName || 'Unknown User';
        if (sellerName && buyerName) {
          otherPersonName = seller?.userId === currentUserId ? decodeURIComponent(buyerName) : decodeURIComponent(sellerName);
        }
        
        const avatarLetter = otherPersonName.charAt(0).toUpperCase();
        const avatarColor = otherPerson?.userId 
          ? `hsl(${parseInt(otherPerson.userId.slice(0, 8), 16) % 360}, 70%, 60%)`
          : '#10b981';
        
        const updatedConversation: Conversation = {
          ...conversation,
          name: otherPersonName,
          seller: seller,
          buyer: buyer,
          otherPerson: otherPerson,
          avatar: otherPerson?.avatar || conversation.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${avatarColor}"/><text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dy=".3em" font-family="Arial">${avatarLetter}</text></svg>`
        };
        
        setSelectedChat(updatedConversation);
        setConversations(prev => 
          prev.map(conv => 
            conv.conversationId === conversation.conversationId 
              ? updatedConversation 
              : conv
          )
        );
        return updatedConversation;
      } else {
        return conversation;
      }
    } catch (error) {
      console.error('❌ ChatBoxHome - Error loading conversation name:', error);
      return conversation;
    }
  };


  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
    
    const initRealTimeMessaging = () => {
      if (window.chatBoxPollingInterval) {
        clearInterval(window.chatBoxPollingInterval);
        window.chatBoxPollingInterval = null;
      }

      const enableWebSocket = import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false';
      
      if (!enableWebSocket) {
        startPolling();
        return;
      }

      const token = tokenService.getAccessToken();
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws";
      
      const wsTimeout = setTimeout(() => {
        if (!websocketService.isConnected()) {
          websocketService.stopReconnecting();
          startPolling();
        }
      }, 5000);
      
      if (!websocketService.isConnected()) {
        websocketService.connect(wsUrl, token);
      } else {
        clearTimeout(wsTimeout);
      }
      
      websocketService.on('connected', () => {
        clearTimeout(wsTimeout);
      });
      
      websocketService.onNewMessage((messageData: WebSocketMessageData) => {
        const conversationId = messageData.conversationId || messageData.payload?.conversationId;
        const content = messageData.content || messageData.payload?.content || messageData.message?.content;
        const createdAt = messageData.createdAt || messageData.payload?.createdAt || messageData.message?.createdAt;
        
        if (conversationId && content) {
          setConversations(prev => {
            const updatedConversations = prev.map(conv => {
              if (conv.conversationId === conversationId) {
                return {
                  ...conv,
                  lastMessage: content,
                  time: new Date(createdAt || new Date()).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  updatedAt: createdAt || new Date().toISOString()
                };
              }
              return conv;
            });
            return updatedConversations;
          });
        }
        
        if (selectedChat && conversationId === selectedChat.conversationId) {
          setMessages(prev => {
            if (currentConversationIdRef.current === conversationId) {
              const messageId = messageData.id || messageData.payload?.id || messageData.message?.id;
              const existingIndex = prev.findIndex(msg => msg.id === messageId);
              if (existingIndex >= 0 && content) {
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  content: content,
                  createdAt: createdAt || new Date().toISOString(),
                  sender: (messageData.sender || messageData.payload?.sender || 'other') as 'user' | 'other'
                };
                return updated;
              } else {
                return [...prev, {
                  id: messageId || Date.now(),
                  sender: (messageData.sender || messageData.payload?.sender || 'other') as 'user' | 'other',
                  content: content || '',
                  createdAt: createdAt || new Date().toISOString(),
                  isRead: false
                }];
              }
            } else {
              return prev;
            }
          });
        }
      });

      websocketService.on('serverUnavailable', () => {
        websocketService.stopReconnecting();
        startPolling();
      });

      websocketService.on('error', () => {
        websocketService.stopReconnecting();
        startPolling();
      });

      websocketService.on('maxReconnectAttemptsReached', () => {
        startPolling();
      });

      websocketService.on('message', (data?: unknown) => {
        const messageData = data as WebSocketMessageData;
        if (messageData?.type === 'new_message' && messageData.payload) {
          // The callback set by onNewMessage will handle this
        } else if (messageData?.type === 'message' && messageData.payload) {
          // The callback set by onNewMessage will handle this
        } else if (messageData?.conversationId || messageData?.content) {
          // The callback set by onNewMessage will handle this
        }
      });
    };

    const startPolling = () => {
      if (window.chatBoxPollingInterval) {
        return;
      }

      const pollInterval = setInterval(async () => {
        const currentConversationId = currentConversationIdRef.current;
        
        try {
          const conversationsResponse = await getUserConversations(currentUserId) as ApiResponse<Conversation[]>;
          if (conversationsResponse.success && conversationsResponse.data) {
            setConversations(prev => {
              const hasChanges = JSON.stringify(prev) !== JSON.stringify(conversationsResponse.data);
              if (hasChanges) {
                return conversationsResponse.data || [];
              }
              return prev;
            });
          }
        } catch {
          // Silent fail
        }
        
        if (currentConversationId) {
          try {
            const response = await getMessages(currentConversationId) as ApiResponse<Array<{
              messageId: string;
              senderId: string;
              content: string;
              createdAt: string;
              isRead: boolean;
            }>>;
            if (response.success && response.data) {
              const transformedMessages: Message[] = response.data.map(msg => {
                const isFromCurrentUser = msg.senderId === currentUserId;
                return {
                  id: msg.messageId,
                  sender: isFromCurrentUser ? 'user' : 'other',
                  content: msg.content,
                  time: new Date(msg.createdAt).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  isRead: msg.isRead,
                  createdAt: msg.createdAt,
                  senderId: msg.senderId
                };
              });
              
              setMessages(prev => {
                if (currentConversationIdRef.current === currentConversationId) {
                  if (JSON.stringify(prev) !== JSON.stringify(transformedMessages)) {
                    if (transformedMessages.length > 0) {
                      const latestMessage = transformedMessages[transformedMessages.length - 1];
                      setConversations(prevConversations => {
                        return prevConversations.map(conv => {
                          if (conv.conversationId === currentConversationId) {
                            return {
                              ...conv,
                              lastMessage: latestMessage.content,
                              time: latestMessage.time,
                              updatedAt: latestMessage.createdAt
                            };
                          }
                          return conv;
                        });
                      });
                    }
                    
                    return transformedMessages;
                  }
                }
                return prev;
              });
            }
          } catch {
            // Silent fail
          }
        }
      }, 5000);

      window.chatBoxPollingInterval = pollInterval;
    };

    initRealTimeMessaging();

    return () => {
      websocketService.disconnect();
      if (window.chatBoxPollingInterval) {
        clearInterval(window.chatBoxPollingInterval);
        window.chatBoxPollingInterval = null;
      }
    };
  }, []);

  // Handle URL parameters for direct conversation access
  useEffect(() => {
    if (conversationId && !urlConversationLoaded.current) {
      if (conversations.length > 0) {
        const targetConversation = conversations.find(conv => conv.conversationId === conversationId);
        if (targetConversation) {
          const displayInfo = getInitialDisplayInfo(
            sellerName, 
            buyerName, 
            targetConversation.name || 'Đang tải...'
          );
          
          const displayName = displayInfo.name;
          const displayAvatar = displayInfo.avatar || targetConversation.avatar;
          
          setSelectedChat({
            ...targetConversation,
            name: displayName,
            avatar: displayAvatar
          });
          
          loadMessages(conversationId);
          urlConversationLoaded.current = true;
          
          if (preset) {
            setNewMessage(decodeURIComponent(preset));
          }
          
          loadConversationName(targetConversation).then(() => {});
          return;
        }
      }
      
      if (conversations.length === 0 || !conversations.find(conv => conv.conversationId === conversationId)) {
        const loadConversationFromAPI = async () => {
          try {
            setLoading(true);
            setError(null);
            
            const displayInfo = getInitialDisplayInfo(sellerName, buyerName);
            const initialName = displayInfo.name;
            const initialAvatar = displayInfo.avatar;
            
            const tempConv: Conversation = {
              conversationId: conversationId,
              name: initialName,
              lastMessage: '',
              time: '',
              isRead: true,
              avatar: initialAvatar,
              isOnline: false,
              lastActive: "Vừa xong",
              type: "individual"
            };
            
            setSelectedChat(tempConv);
            setConversations([tempConv]);
            urlConversationLoaded.current = true;
            
            if (preset) {
              setNewMessage(decodeURIComponent(preset));
            }
            
            loadMessages(conversationId);
            setLoading(false);
            
            try {
              const response = await getConversation(conversationId) as ApiResponse<{ seller: User; buyer: User }>;
              
              if (response?.success && response.data?.seller && response.data?.buyer) {
                const { seller, buyer } = response.data;
                const otherPerson = seller?.userId === currentUserId ? buyer : seller;
                
                const finalName = otherPerson?.fullName || initialName;
                const finalAvatar = otherPerson?.avatar || generateAvatarSVG(finalName, otherPerson?.userId || null);
                
                const updatedConv: Conversation = {
                  ...tempConv,
                  name: finalName,
                  avatar: finalAvatar,
                  seller: seller,
                  buyer: buyer,
                  otherPerson: otherPerson
                };
                
                setSelectedChat(updatedConv);
                setConversations([updatedConv]);
              }
            } catch (apiError) {
              console.warn('⚠️ ChatBoxHome - API call failed, using URL params:', apiError);
            }
          } catch (error) {
            console.error('❌ ChatBoxHome - Error loading conversation:', error);
            setError('Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
            setLoading(false);
            urlConversationLoaded.current = false;
          }
        };
        
        loadConversationFromAPI();
      } else {
        if (preset) {
          setNewMessage(decodeURIComponent(preset));
        }
      }
    }
  }, [conversationId, conversations.length, preset, sellerName, buyerName, currentUserId]);

  // Load conversations from API
  const loadConversations = async (preserveSelectedChat: boolean = false): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserConversations(currentUserId) as ApiResponse<Conversation[]>;
      
      if (response.success) {
        setConversations(response.data || []);
        
        if (response.data && response.data.length > 0 && !selectedChat && !preserveSelectedChat && !currentConversationIdRef.current) {
            const firstConv = response.data[0];
            const otherPerson = firstConv.seller?.userId === currentUserId ? firstConv.buyer : firstConv.seller;
            
            const transformedConv: Conversation = {
              conversationId: firstConv.conversationId,
              name: otherPerson?.fullName || 'Đang tải...',
              lastMessage: firstConv.lastMessage || 'Chưa có tin nhắn',
              time: firstConv.updatedAt ? new Date(firstConv.updatedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              }) : '',
              isRead: true,
              avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
              isOnline: false,
              lastActive: "Không xác định",
              type: "individual",
              listing: firstConv.listing,
              seller: firstConv.seller,
              buyer: firstConv.buyer,
              currentUserId: currentUserId || undefined,
              otherPerson: otherPerson
            };
          
          if (!otherPerson?.fullName) {
            setSelectedChat(transformedConv);
            const updatedConv = await loadConversationName(transformedConv);
            await loadMessages(updatedConv.conversationId);
          } else {
            setSelectedChat(transformedConv);
            await loadMessages(firstConv.conversationId);
          }
        } else if (preserveSelectedChat && selectedChat) {
          // Do nothing
        } else if (currentConversationIdRef.current && !selectedChat) {
          const restoredChat = response.data?.find(conv => conv.conversationId === currentConversationIdRef.current);
          if (restoredChat) {
            setSelectedChat(restoredChat);
          }
        }
      }
    } catch (err) {
      console.error('❌ ChatBoxHome - Error loading conversations:', err);
      setError('Không thể tải danh sách cuộc trò chuyện');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string | null): Promise<void> => {
    try {
      currentConversationIdRef.current = conversationId;
      
      if (!conversationId) {
        setMessages([]);
        return;
      }
      
      const response = await getMessages(conversationId) as ApiResponse<Array<{
        messageId: string;
        senderId: string;
        content: string;
        createdAt: string;
        isRead: boolean;
      }>>;
      
      if (response.success) {
        const messageData = response.data || [];
        
        const transformedMessages: Message[] = messageData.map(msg => {
          const isFromCurrentUser = msg.senderId === currentUserId;
          
          return {
            id: msg.messageId,
            sender: isFromCurrentUser ? 'user' : 'other',
            content: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isRead: msg.isRead,
            createdAt: msg.createdAt,
            senderId: msg.senderId
          };
        });
        setMessages(transformedMessages);
        
        if (transformedMessages.length > 0) {
          markMessagesAsRead(transformedMessages);
        }
        
        setError(null);
      } else {
        setMessages([]);
        setError(null);
      }
    } catch (err) {
      const axiosError = err as { response?: { status?: number }; code?: string };
      console.error('❌ Error loading messages:', err);
      
      if (axiosError.response?.status === 404 || axiosError.code === 'ERR_NETWORK') {
        setMessages([]);
        setError(null);
      } else {
        setMessages([]);
        setError(null);
      }
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messages: Message[]): Promise<void> => {
    try {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== currentUserId && !msg.isRead
      );
      
      for (const message of unreadMessages) {
        try {
          await markMessageAsRead(message.id);
        } catch (error) {
          console.error('❌ Error marking message as read:', message.id, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsRead:', error);
    }
  };

  const scrollToBottom = (): void => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = async (): Promise<void> => {
    if ((newMessage.trim() || selectedFiles.length > 0) && selectedChat) {
      try {
        const tempId = Date.now();
        
        const messageText = newMessage.trim();
        const filesToUpload = [...selectedFiles];
        
        let messageContentToSend = messageText;
        let uploadedFiles: UploadResult[] = [];
        
        if (filesToUpload.length > 0) {
          const tempMessage: Message = {
            id: tempId,
            sender: "user",
            content: "📤 Đang tải lên...",
            createdAt: new Date().toISOString(),
            isRead: false,
            senderId: currentUserId || undefined,
            isUploading: true
          };
          
          setMessages(prev => [...prev, tempMessage]);
          setNewMessage("");
          setSelectedFiles([]);
          setImagePreview(null);
          
          try {
            console.log(`📤 Uploading ${filesToUpload.length} file(s)...`);
            const uploadResults = await uploadMultipleFiles(
              filesToUpload.map(f => f.file),
              { folder: 'chat_messages' }
            ) as UploadResult[];
            
            const successfulUploads = uploadResults.filter(r => r.success);
            const failedUploads = uploadResults.filter(r => !r.success);
            
            if (failedUploads.length > 0) {
              console.error('❌ Some uploads failed:', failedUploads);
              setError(`Không thể tải lên ${failedUploads.length} file`);
            }
            
            if (successfulUploads.length === 0) {
              setMessages(prev => prev.filter(msg => msg.id !== tempId));
              setError('Không thể tải lên file. Vui lòng thử lại.');
              return;
            }
            
            uploadedFiles = successfulUploads;
            
            if (uploadedFiles.length === 1) {
              const upload = uploadedFiles[0];
              messageContentToSend = createMediaMessageContent(
                upload.data.resourceType,
                upload.data.url,
                messageText,
                {
                  width: upload.data.width,
                  height: upload.data.height,
                  format: upload.data.format,
                  size: upload.data.size,
                  duration: upload.data.duration,
                  thumbnail: upload.data.thumbnail
                }
              ) as string;
            } else {
              messageContentToSend = JSON.stringify({
                type: 'multiple',
                text: messageText,
                media: uploadedFiles.map(upload => ({
                  type: upload.data.resourceType,
                  url: upload.data.url,
                  metadata: {
                    width: upload.data.width,
                    height: upload.data.height,
                    format: upload.data.format,
                    size: upload.data.size,
                    duration: upload.data.duration,
                    thumbnail: upload.data.thumbnail
                  }
                }))
              });
            }
            
            console.log('✅ All files uploaded successfully');
          } catch (uploadError) {
            console.error('❌ Upload error:', uploadError);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setError('Không thể tải lên file. Vui lòng thử lại.');
            return;
          }
        } else {
          const tempMessage: Message = {
            id: tempId,
            sender: "user",
            content: messageText,
            createdAt: new Date().toISOString(),
            isRead: false,
            senderId: currentUserId || undefined
          };
          
          setMessages(prev => [...prev, tempMessage]);
          setNewMessage("");
          setSelectedFiles([]);
          setImagePreview(null);
        }

        const response = await sendMessage(
          selectedChat.conversationId,
          currentUserId,
          messageContentToSend
        ) as ApiResponse<{ messageId: string; createdAt: string }>;

        if (response.success) {
          const realMessage: Message = {
            id: response.data?.messageId || tempId,
            sender: "user",
            content: messageContentToSend,
            createdAt: response.data?.createdAt || new Date().toISOString(),
            isRead: false,
            senderId: currentUserId || undefined
          };

          setMessages(prev => prev.map(msg => 
            msg.id === tempId ? realMessage : msg
          ));

          let previewText = messageText || '📷 Đã gửi ảnh';
          if (uploadedFiles.length > 0) {
            const firstFile = uploadedFiles[0];
            if (firstFile.data.resourceType === 'video') {
              previewText = messageText || '🎥 Đã gửi video';
            } else if (uploadedFiles.length > 1) {
              previewText = messageText || `📷 Đã gửi ${uploadedFiles.length} file`;
            }
          }
          
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.conversationId === selectedChat.conversationId) {
                return {
                  ...conv,
                  lastMessage: previewText,
                  time: new Date(realMessage.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  updatedAt: realMessage.createdAt
                };
              }
              return conv;
            });
          });

          const enableWebSocket = import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false';
          if (enableWebSocket && websocketService.isConnected()) {
            try {
              websocketService.send({
                type: 'new_message',
                payload: {
                  conversationId: selectedChat.conversationId,
                  message: realMessage
                }
              });
            } catch {
              // Silent fail
            }
          }
        } else {
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setError('Không thể gửi tin nhắn');
          console.error('❌ Failed to send message:', response);
        }
      } catch (err) {
        console.error('❌ Error sending message:', err);
        setError('Không thể gửi tin nhắn');
        const tempId = Date.now();
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    }
  };

  const handleChatSelect = async (chat: Conversation | Chat): Promise<void> => {
    // Handle both Chat and Conversation types
    let conversationId: string;
    let conversation: Conversation;
    
    // Type guard to check if it's a Chat
    const isChat = (c: Conversation | Chat): c is Chat => {
      return 'id' in c && !('conversationId' in c && c.conversationId === c.id);
    };
    
    if ('conversationId' in chat && !isChat(chat)) {
      // It's a Conversation
      conversationId = chat.conversationId;
      conversation = chat;
    } else {
      // It's a Chat - convert to Conversation
      const chatItem = chat as Chat;
      conversationId = chatItem.id;
      conversation = {
        conversationId: chatItem.id,
        lastMessage: chatItem.lastMessage,
        updatedAt: chatItem.updatedAt,
        seller: chatItem.seller,
        buyer: chatItem.buyer,
        listing: chatItem.listing,
        name: chatItem.name,
        avatar: chatItem.avatar,
        isOnline: chatItem.isOnline,
        lastActive: chatItem.lastActive,
        type: chatItem.type,
        otherPerson: chatItem.otherPerson
      };
    }
    
    currentConversationIdRef.current = conversationId;
    setMessages([]);
    setNewMessage("");
    setSelectedFiles([]);
    setImagePreview(null);
    
    if (conversation.name === 'Unknown User' || !conversation.name) {
      setSelectedChat({
        ...conversation,
        name: 'Đang tải...'
      });
      
      const updatedChat = await loadConversationName(conversation);
      await loadMessages(updatedChat.conversationId);
    } else {
      setSelectedChat(conversation);
      await loadMessages(conversationId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newFiles = Array.from(e.target.files || []);
    const processedFilesPromises = newFiles.map(file => {
      return new Promise<FileItem>(resolve => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({ file, dataURL: event.target?.result as string });
          };
          reader.readAsDataURL(file);
        } else {
          resolve({ file });
        }
      });
    });

    Promise.all(processedFilesPromises).then(processed => {
      setSelectedFiles(prev => [...prev, ...processed]);
      const firstImage = processed.find(item => item.dataURL);
      if (firstImage) {
        setImagePreview(firstImage.dataURL || null);
      }
    });
  };

  const handleVoiceRecord = (): void => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const voiceMessage: Message = {
          id: Date.now(),
          sender: "user",
          content: "🎤 Tin nhắn thoại",
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          isRead: true,
          isVoice: true
        };
        setTimeout(() => {
          setMessages(prev => [...prev, voiceMessage]);
        }, 50);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const removeFile = (index: number): void => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (imagePreview && !newFiles.some(f => f.dataURL === imagePreview)) {
        const nextImage = newFiles.find(f => f.dataURL);
        setImagePreview(nextImage ? nextImage.dataURL || null : null);
      }
      return newFiles;
    });
  };

  const removeImagePreview = (): void => {
    setImagePreview(null);
    setSelectedFiles(prev => prev.filter(f => !f.dataURL));
  };

  const clearAllFiles = (): void => {
    setSelectedFiles([]);
    setImagePreview(null);
  };

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ height: 'calc(100vh - 68px)' }}>
      {/* Left Sidebar */}
      <ChatList 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedChat={selectedChat}
        onChatSelect={handleChatSelect}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        settingsMenuRef={settingsMenuRef}
        conversations={conversations}
        loading={loading}
        error={error}
        showBorder={true}
        isDarkMode={isDarkMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {conversations.length === 0 ? (
          <div className={`flex-1 flex flex-col items-center justify-center px-8 h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="relative mb-8">
              <div className="flex items-center justify-center space-x-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#4da6ff]/20 rounded-full flex items-center justify-center">
                    <FaUser className="w-8 h-8 text-[#4da6ff]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#4da6ff]/40 rounded-full flex items-center justify-center">
                    <FaCommentDots className="w-3 h-3 text-[#4da6ff]" />
                  </div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-[#4da6ff]/20 rounded-full flex items-center justify-center">
                    <FaUser className="w-8 h-8 text-[#4da6ff]" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#4da6ff]/40 rounded-full flex items-center justify-center">
                    <FaCommentDots className="w-3 h-3 text-[#4da6ff]" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-4 h-4 bg-[#4da6ff]/40 rounded-full"></div>
              </div>
              <div className="absolute -bottom-4 right-1/4">
                <div className="w-3 h-3 bg-[#4da6ff]/40 rounded-full"></div>
              </div>
              <div className="absolute -bottom-2 left-1/4">
                <div className="w-2 h-2 bg-[#4da6ff]/40 rounded-full"></div>
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Bạn chưa có cuộc trò chuyện nào!
            </h2>
            <p className={`text-center mb-8 max-w-md text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
              Trải nghiệm chat để làm rõ thông tin về mặt hàng trước khi bắt đầu thực hiện mua bán
            </p>
            <Link
              to="/"
              className="bg-[#4da6ff] hover:bg-[#4da6ff]/90 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg border border-[#4da6ff]"
            >
              Về trang chủ
            </Link>
          </div>
        ) : selectedChat ? (
          <>
            <ChatHeader selectedChat={selectedChat} isDarkMode={isDarkMode} />
            <MessageList 
              messages={messages}
              messagesEndRef={messagesEndRef}
              isDarkMode={isDarkMode}
            />
            <MessageInput 
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSendMessage={handleSendMessage}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              isRecording={isRecording}
              onVoiceRecord={handleVoiceRecord}
              onFileSelect={handleFileSelect}
              onRemoveFile={removeFile}
              onRemoveImagePreview={removeImagePreview}
              onClearAllFiles={clearAllFiles}
              isDarkMode={isDarkMode}
            />
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center px-8 h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="relative mb-8">
              <div className="flex items-center justify-center space-x-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#4da6ff]/20 rounded-full flex items-center justify-center">
                    <FaUser className="w-8 h-8 text-[#4da6ff]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#4da6ff]/40 rounded-full flex items-center justify-center">
                    <FaCommentDots className="w-3 h-3 text-[#4da6ff]" />
                  </div>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-[#4da6ff]/20 rounded-full flex items-center justify-center">
                    <FaUser className="w-8 h-8 text-[#4da6ff]" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#4da6ff]/40 rounded-full flex items-center justify-center">
                    <FaCommentDots className="w-3 h-3 text-[#4da6ff]" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-4 h-4 bg-[#4da6ff]/40 rounded-full"></div>
              </div>
              <div className="absolute -bottom-4 right-1/4">
                <div className="w-3 h-3 bg-[#4da6ff]/40 rounded-full"></div>
              </div>
              <div className="absolute -bottom-2 left-1/4">
                <div className="w-2 h-2 bg-[#4da6ff]/40 rounded-full"></div>
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Bạn chưa có cuộc trò chuyện nào!
            </h2>
            <p className={`text-center mb-8 max-w-md text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
              Trải nghiệm chat để làm rõ thông tin về mặt hàng trước khi bắt đầu thực hiện mua bán
            </p>
            <Link
              to="/"
              className="bg-[#4da6ff] hover:bg-[#4da6ff]/90 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg border border-[#4da6ff]"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBoxHome;
