import { useEffect, useState } from "react";
import { FaEllipsisV, FaSearch, FaSpinner, FaTrashAlt } from "react-icons/fa";
import { parseMessageContent } from "../../../services/upload/uploadService";
import { useAuth } from "../../../context/AuthContext";
import type {
  UserChatResponse,
  ConversationResponse,
} from "../../../services/chats/chatService";

// ============ TYPE DEFINITIONS ============

export interface Chat extends Omit<ConversationResponse, "conversationId"> {
  conversationId: string;
  id: string;
  name: string;
  time: string;
  avatar: string;
  otherPerson: UserChatResponse;
}

interface ChatListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;

  showSettingsMenu: boolean;
  setShowSettingsMenu: (show: boolean) => void;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  onDeleteConversation?: (conversationId: string) => void | Promise<void>;
  onDeleteConversationForAll?: (conversationId: string) => void | Promise<void>;
  deletingConversationId?: string | null;
  conversations: ConversationResponse[];
  loading: boolean;
  error: string | null;
  isFullWidth?: boolean;
  showBorder?: boolean;
  isDarkMode?: boolean;
}

// ============ UTILITY FUNCTIONS ============

const generateAvatarSVG = (
  name: string,
  userId: string | null = null,
): string => {
  const letter = name.charAt(0).toUpperCase();
  const color = userId
    ? `hsl(${parseInt(userId.slice(0, 8), 16) % 360}, 70%, 60%)`
    : "#10b981";

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/><text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dy=".3em" font-family="Arial">${letter}</text></svg>`;
};

const getMessagePreview = (content: string): string => {
  if (!content) return "Chưa có tin nhắn";
  const parsed = parseMessageContent(content) as {
    isMedia?: boolean;
    text?: string;
    type?: string;
    media?: unknown[];
  };

  if (parsed.isMedia) {
    const text = parsed.text || "";
    if (parsed.type === "image") return text ? `📷 ${text}` : "📷 Đã gửi ảnh";
    if (parsed.type === "video") return text ? `🎥 ${text}` : "🎥 Đã gửi video";
    if (parsed.type === "multiple")
      return text
        ? `📎 ${text}`
        : `📎 Đã gửi ${parsed.media?.length || 0} file`;
  }
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
  onDeleteConversation,
  onDeleteConversationForAll,
  deletingConversationId = null,
  conversations,
  loading,
  error,
  isFullWidth = false,
  showBorder = false,
  isDarkMode = false,
}: ChatListProps) => {
  const { user } = useAuth();
  const currentUserId = user?.userId;
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setMenuConversationId(null);
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [setShowSettingsMenu, settingsMenuRef]);

  const transformedConversations: Chat[] = conversations
    .map((conv) => {
      const otherPerson =
        conv.user1?.userId === currentUserId ? conv.user2 : conv.user1;
      const displayUserName = otherPerson?.userName || "Người dùng hệ thống";
      const validConversationId = conv.conversationId || ""; // Fallback nếu null

      return {
        ...conv,
        conversationId: validConversationId,
        id: validConversationId,
        name: displayUserName,
        time: conv.updatedAt
          ? new Date(conv.updatedAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        avatar:
          otherPerson?.avatar ||
          generateAvatarSVG(displayUserName, otherPerson?.userId),
        otherPerson: otherPerson,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const filteredChats = transformedConversations.filter((chat) => {
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const messagePreview = getMessagePreview(
        chat.lastMessage || "",
      ).toLowerCase();

      if (
        !chat.name?.toLowerCase().includes(query) &&
        !messagePreview.includes(query)
      )
        return false;
    }
    if (activeTab === "unread") return chat.isRead === false;
    return true;
  });

  return (
    <div
      className={`${isFullWidth ? "w-full" : "w-80"} flex flex-col h-full min-h-0 ${showBorder ? `border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}` : ""} ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
    >
      {/* Search Bar & Tabs */}
      <div
        className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-[#4da6ff] outline-none text-sm ${isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 border-gray-300"}`}
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "unread"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors ${activeTab === tab ? "bg-[#4da6ff]/20 text-[#4da6ff]" : isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {tab === "all" ? "Tất cả" : "Chưa đọc"}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="w-6 h-6 text-[#4da6ff] animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-8 text-xs">{error}</p>
        ) : (
          <div className="space-y-1 pt-2">
            {filteredChats.map((chat) => {
              const isSelected =
                selectedChat?.conversationId === chat.conversationId;
              const canDeleteForAll = Boolean(
                (chat as Chat & { canDeleteForAll?: boolean }).canDeleteForAll,
              );
              return (
                <div
                  key={chat.conversationId}
                  onClick={() => {
                    setMenuConversationId(null);
                    setShowSettingsMenu(false);
                    onChatSelect(chat);
                  }}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? "bg-[#4da6ff]/10 border border-[#4da6ff]/20" : isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                >
                  <div className="relative">
                    <img
                      src={chat.avatar}
                      alt=""
                      className={`w-12 h-12 rounded-full mr-3 ring-2 ${isSelected ? "ring-[#4da6ff]" : "ring-transparent"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-semibold truncate ${isSelected ? "text-[#4da6ff]" : isDarkMode ? "text-white" : "text-gray-800"}`}
                      >
                        {chat.name}
                      </h3>
                      <span className="text-[10px] text-gray-500">
                        {chat.time}
                      </span>
                    </div>
                    <p className="text-xs truncate text-gray-500">
                      {getMessagePreview(chat.lastMessage)}
                    </p>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    {chat.isRead === false && (
                      <div className="w-2.5 h-2.5 bg-[#4da6ff] rounded-full" />
                    )}

                    <div
                      className="relative"
                      ref={
                        showSettingsMenu && menuConversationId === chat.conversationId
                          ? settingsMenuRef
                          : null
                      }
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          const nextOpen =
                            !(showSettingsMenu && menuConversationId === chat.conversationId);
                          setMenuConversationId(nextOpen ? chat.conversationId : null);
                          setShowSettingsMenu(nextOpen);
                        }}
                        className={`rounded-full p-1.5 transition-colors ${isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}
                        title="Tùy chọn"
                      >
                        <FaEllipsisV className="h-3 w-3" />
                      </button>

                      {showSettingsMenu && menuConversationId === chat.conversationId ? (
                        <div
                          className={`absolute right-0 z-20 mt-1 min-w-44 rounded-lg border shadow-lg ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                        >
                          <button
                            type="button"
                            disabled={deletingConversationId === chat.conversationId}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteConversation?.(chat.conversationId);
                              setMenuConversationId(null);
                              setShowSettingsMenu(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:opacity-50 ${isDarkMode ? "text-rose-300 hover:bg-gray-700" : "text-rose-600 hover:bg-rose-50"}`}
                          >
                            <FaTrashAlt className="h-3 w-3" />
                            {deletingConversationId === chat.conversationId
                              ? "Đang xóa..."
                              : "Xóa cuộc trò chuyện"}
                          </button>

                          {canDeleteForAll ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDeleteConversationForAll?.(chat.conversationId);
                                setMenuConversationId(null);
                                setShowSettingsMenu(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm ${isDarkMode ? "text-orange-300 hover:bg-gray-700" : "text-orange-600 hover:bg-orange-50"}`}
                            >
                              Xóa trò chuyện nhóm
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
