import { FaSearch, FaEllipsisV, FaCommentDots, FaSpinner } from "react-icons/fa";
import { parseMessageContent } from "../../../services/upload/uploadService";

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

interface ChatListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedChat: Chat | Conversation | null;
  onChatSelect: (chat: Chat | Conversation) => void;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (show: boolean) => void;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  isFullWidth?: boolean;
  showBorder?: boolean;
  isDarkMode?: boolean;
}

/**
 * Format message content for preview display
 */
const getMessagePreview = (content: string): string => {
  if (!content) return 'Chưa có tin nhắn';
  
  // Try to parse as media message
  const parsed = parseMessageContent(content) as {
    isMedia: boolean;
    text?: string;
    type?: string;
    media?: Array<unknown>;
  };
  
  if (parsed.isMedia) {
    // Media message - show preview with icon
    const text = parsed.text || '';
    
    if (parsed.type === 'image') {
      return text ? `📷 ${text}` : '📷 Đã gửi ảnh';
    } else if (parsed.type === 'video') {
      return text ? `🎥 ${text}` : '🎥 Đã gửi video';
    } else if (parsed.type === 'multiple') {
      const mediaCount = parsed.media?.length || 0;
      return text ? `📎 ${text}` : `📎 Đã gửi ${mediaCount} file`;
    }
  }
  
  // Regular text message
  return parsed.text || content;
};

const ChatList = ({ 
  searchQuery, 
  setSearchQuery, 
  activeTab, 
  setActiveTab, 
  selectedChat, 
  onChatSelect, 
  showSettingsMenu, 
  setShowSettingsMenu, 
  settingsMenuRef,
  conversations,
  loading,
  error,
  isFullWidth = false,
  showBorder = false,
  isDarkMode = false
}: ChatListProps) => {
  // Get current user ID from localStorage
  // TEMPLATE MODE: Returns demo user ID if not logged in
  const getCurrentUserId = (): string => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo) as { userId: string };
        return user.userId;
      }
    } catch (error) {
      console.error('❌ Error parsing userInfo from localStorage:', error);
    }
    // TEMPLATE MODE: Return demo user ID
    return 'currentUser';
  };
  
  const currentUserId = getCurrentUserId();

  // Transform conversations to match the expected format
  const transformedConversations: Chat[] = conversations.map(conv => {
    // Determine the other person's name (not current user)
    const otherPerson = conv.seller?.userId === currentUserId ? conv.buyer : conv.seller;
    const otherPersonName = otherPerson?.fullName || 'Unknown User';
    
    return {
      id: conv.conversationId,
      conversationId: conv.conversationId,
      name: otherPersonName,
      lastMessage: conv.lastMessage || 'Chưa có tin nhắn',
      time: conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '',
      isRead: true,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      isOnline: false,
      lastActive: "Không xác định",
      type: "individual",
      listing: conv.listing,
      seller: conv.seller,
      buyer: conv.buyer,
      currentUserId: currentUserId,
      otherPerson: otherPerson,
      updatedAt: conv.updatedAt
    };
  })
  // Sort conversations by updatedAt (newest first)
  .sort((a, b) => {
    if (!a.updatedAt) return 1;
    if (!b.updatedAt) return -1;
    
    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    
    return timeB - timeA;
  });

  const filteredChats = transformedConversations.filter(chat => {
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const messagePreview = getMessagePreview(chat.lastMessage).toLowerCase();
      
      if (!chat.name.toLowerCase().includes(query) && 
          !messagePreview.includes(query)) {
        return false;
      }
    }
    
    // Filter by tab
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !chat.isRead;
    if (activeTab === "group") return chat.type === "group";
    return true;
  });

  return (
    <div className={`${isFullWidth ? 'w-full' : 'w-80'} flex flex-col h-full min-h-0 ${isFullWidth ? '' : 'flex-shrink-0'} ${showBorder ? `border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}` : ''} ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm trên ChatBox"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-[#4da6ff] outline-none text-sm transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 border-gray-700 hover:border-[#4da6ff] focus:border-[#4da6ff]' 
                : 'bg-gray-100 focus:bg-white text-gray-900 placeholder-gray-500 border-gray-300 hover:border-[#4da6ff] focus:border-[#4da6ff]'
            }`}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors ${
              activeTab === "all"
                ? "bg-[#4da6ff]/20 text-[#4da6ff]"
                : isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors ${
              activeTab === "unread"
                ? "bg-[#4da6ff]/20 text-[#4da6ff]"
                : isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Chưa đọc
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors ${
              activeTab === "group"
                ? "bg-[#4da6ff]/20 text-[#4da6ff]"
                : isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Nhóm
          </button>
          <div className="relative" ref={settingsMenuRef}>
            <button 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-1.5 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FaEllipsisV className="h-3 w-3" />
            </button>
            
            {showSettingsMenu && (
              <div className={`absolute right-0 top-8 w-56 border rounded-lg shadow-lg z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="py-2">
                  <button className={`w-full flex items-center px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cài đặt trả lời tự động</span>
                  </button>
                  
                  <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                  
                  <button className={`w-full flex items-center px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Quản lý Tin nhắn nhanh</span>
                  </button>
                  
                  <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                  
                  <button className={`w-full flex items-center px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Hội thoại đã ẩn</span>
                  </button>
                  
                  <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                  
                  <button className={`w-full flex items-center px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Tin nhắn rác</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="w-6 h-6 text-[#4da6ff] animate-spin" />
            <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Đang tải...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-red-900' : 'bg-red-100'}`}>
              <FaCommentDots className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Lỗi tải dữ liệu</h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          </div>
        ) : (
        <div className="space-y-2 pt-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                onChatSelect(chat);
              }}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                (selectedChat && ('id' in selectedChat ? selectedChat.id === chat.id : selectedChat.conversationId === chat.id))
                  ? isDarkMode ? "bg-gradient-to-r from-[#4da6ff]/20 to-[#4da6ff]/10 border border-[#4da6ff] shadow-sm" : "bg-gradient-to-r from-[#4da6ff]/20 to-[#4da6ff]/10 border border-[#4da6ff] shadow-sm"
                  : isDarkMode 
                    ? "bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-gray-600"
                    : "bg-gradient-to-r from-gray-100 to-gray-200 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 border border-transparent hover:border-gray-300"
              }`}
            >
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className={`w-12 h-12 rounded-full mr-3 ring-2 transition-all duration-200 ${
                    (selectedChat && ('id' in selectedChat ? selectedChat.id === chat.id : selectedChat.conversationId === chat.id))
                      ? "ring-[#4da6ff] hover:ring-[#4da6ff]"
                      : "ring-gray-300 hover:ring-gray-400"
                  }`}
                />
                {chat.isOnline && (
                  <div className={`absolute bottom-0 right-3 w-3 h-3 bg-green-500 border-2 rounded-full shadow-sm ${isDarkMode ? 'border-gray-800' : 'border-white'}`}></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold truncate transition-colors duration-200 ${
                    (selectedChat && ('id' in selectedChat ? selectedChat.id === chat.id : selectedChat.conversationId === chat.id))
                      ? "text-[#4da6ff] hover:text-[#4da6ff]"
                      : isDarkMode ? "text-white hover:text-gray-200" : "text-gray-800 hover:text-gray-900"
                  }`}>
                    {chat.name}
                  </h3>
                  {chat.time && (
                    <span className={`text-xs ml-2 flex-shrink-0 transition-colors duration-200 ${
                      (selectedChat && ('id' in selectedChat ? selectedChat.id === chat.id : selectedChat.conversationId === chat.id))
                        ? "text-[#4da6ff]"
                        : isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {chat.time}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate mt-1 transition-colors duration-200 ${
                    (selectedChat && ('id' in selectedChat ? selectedChat.id === chat.id : selectedChat.conversationId === chat.id))
                      ? "text-[#4da6ff] hover:text-[#4da6ff]"
                      : isDarkMode ? "text-gray-300 hover:text-gray-200" : "text-gray-600 hover:text-gray-700"
                  }`}>
                    {getMessagePreview(chat.lastMessage)}
                  </p>
                  {chat.type === "group" && chat.memberCount && (
                    <span className={`text-xs ml-2 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {chat.memberCount} thành viên
                    </span>
                  )}
                </div>
              </div>
              {!chat.isRead && (
                <div className="w-3 h-3 bg-gradient-to-r from-[#4da6ff]/60 to-[#4da6ff] rounded-full ml-2 shadow-sm ring-2 ring-[#4da6ff]/20"></div>
              )}
            </div>
            ))}
            
            {filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-[#4da6ff]/20' : 'bg-[#4da6ff]/10'}`}>
                  <FaCommentDots className={`w-8 h-8 ${isDarkMode ? 'text-[#4da6ff]' : 'text-[#4da6ff]'}`} />
                </div>
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {activeTab === "unread" ? "Không có tin nhắn chưa đọc" : 
                   activeTab === "group" ? "Không có nhóm chat" : 
                   "Không có cuộc trò chuyện"}
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeTab === "unread" ? "Tất cả tin nhắn đã được đọc" : 
                   activeTab === "group" ? "Bạn chưa tham gia nhóm nào" : 
                   "Bạn chưa có cuộc trò chuyện nào"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ChatList;
