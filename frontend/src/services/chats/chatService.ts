// Chat Service - API calls for chat functionality
// TEMPLATE MODE: Using mock data for frontend development
// TODO: Replace with actual API calls when backend is ready

import { mockConversations, mockMessages, mockUsers, getCurrentUserId, generateAvatarSVG } from './mockData';

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
}

interface Message {
  messageId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  messageId?: string;
  createdAt?: string;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get user conversations - TEMPLATE MODE: Returns mock data
export const getUserConversations = async (userId: string | null): Promise<ApiResponse<Conversation[]>> => {
  await delay(300); // Simulate network delay
  
  if (!userId) {
    return { success: false, data: [] };
  }

  const currentUserId = getCurrentUserId();
  
  // Transform mock conversations to match expected format
  const conversations = mockConversations.map(conv => {
    // Determine the other person (not current user)
    const otherPerson = conv.seller?.userId === currentUserId ? conv.buyer : conv.seller;
    const otherPersonData = mockUsers.find(u => u.userId === otherPerson?.userId) || otherPerson;
    
    return {
      ...conv,
      seller: conv.seller,
      buyer: conv.buyer,
      // Add display info for the other person
      otherPerson: otherPersonData || {
        userId: otherPerson?.userId || '',
        fullName: otherPersonData?.fullName || 'Unknown User',
        avatar: otherPersonData?.avatar || generateAvatarSVG(otherPersonData?.fullName || '?', otherPerson?.userId || null)
      }
    };
  });

  return { success: true, data: conversations };
};

// Get messages for a conversation - TEMPLATE MODE: Returns mock data + localStorage messages
export const getMessages = async (conversationId: string | null): Promise<ApiResponse<Message[]>> => {
  await delay(200); // Simulate network delay
  
  if (!conversationId) {
    return { success: false, data: [] };
  }

  // Get messages from localStorage (for demo messages sent in template mode)
  const storageKey = `chat_messages_${conversationId}`;
  const storedMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Merge with mock messages (mock messages are base, stored messages are additions)
  const mockMsgs = mockMessages[conversationId] || [];
  const allMessages = [...mockMsgs, ...storedMessages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  return { success: true, data: allMessages };
};

// Send message - TEMPLATE MODE: Simulates sending (stores in localStorage for demo)
export const sendMessage = async (
  conversationId: string,
  senderId: string | null,
  content: string
): Promise<ApiResponse<{ messageId: string; createdAt: string }>> => {
  await delay(200); // Simulate network delay
  
  if (!conversationId || !senderId || !content.trim()) {
    return { success: false };
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  // Store message in localStorage for demo (will be replaced with API call)
  const storageKey = `chat_messages_${conversationId}`;
  const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const newMessage = {
    messageId,
    senderId,
    content,
    createdAt,
    isRead: false
  };
  existingMessages.push(newMessage);
  localStorage.setItem(storageKey, JSON.stringify(existingMessages));

  // Update conversation last message
  const convKey = `chat_conversations`;
  const conversations = JSON.parse(localStorage.getItem(convKey) || JSON.stringify(mockConversations));
  const convIndex = conversations.findIndex((c: Conversation) => c.conversationId === conversationId);
  if (convIndex >= 0) {
    conversations[convIndex].lastMessage = content;
    conversations[convIndex].updatedAt = createdAt;
    localStorage.setItem(convKey, JSON.stringify(conversations));
  }

  return { 
    success: true, 
    data: { 
      messageId, 
      createdAt
    } 
  };
};

export const createConversation = async (
  sellerId: string,
  buyerId: string,
  listingId?: string
): Promise<ApiResponse<Conversation>> => {
  // TODO: Implement API call
  return { 
    success: true, 
    data: { 
      conversationId: Date.now().toString(),
      seller: { userId: sellerId },
      buyer: { userId: buyerId }
    } 
  };
};

// Get conversation details - TEMPLATE MODE: Returns mock data
export const getConversation = async (conversationId: string): Promise<ApiResponse<{ seller: User; buyer: User }>> => {
  await delay(200); // Simulate network delay
  
  const conversation = mockConversations.find(c => c.conversationId === conversationId);
  
  if (!conversation) {
    return { 
      success: false, 
      data: { 
        seller: { userId: '' },
        buyer: { userId: '' }
      } 
    };
  }

  // Get full user data from mockUsers
  const seller = mockUsers.find(u => u.userId === conversation.seller?.userId) || conversation.seller || { userId: '' };
  const buyer = mockUsers.find(u => u.userId === conversation.buyer?.userId) || conversation.buyer || { userId: '' };

  return { 
    success: true, 
    data: { 
      seller: seller as User,
      buyer: buyer as User
    } 
  };
};

// Mark message as read - TEMPLATE MODE: Simulates marking as read
export const markMessageAsRead = async (messageId: string | number): Promise<ApiResponse<void>> => {
  await delay(100); // Simulate network delay
  
  // In template mode, just return success
  // TODO: Implement actual API call to mark message as read
  return { success: true };
};
