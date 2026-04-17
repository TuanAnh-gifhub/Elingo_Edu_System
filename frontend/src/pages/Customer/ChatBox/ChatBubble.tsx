import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { FaTimes, FaMinus, FaCommentDots, FaArrowLeft, FaTrashAlt } from "react-icons/fa";
import ChatList from "./ChatList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useUnreadMessages } from "../../../hooks/useUnreadMessages";
import { useAuth } from "../../../context/AuthContext";
import { useChat } from "./useChat";

const ChatBubble = () => {
  const { unreadCount } = useUnreadMessages(10000);
  const { user } = useAuth();
  const currentUserId = user?.userId || null;

  /* ---------- UI STATE ---------- */
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Ref để Hook biết Bubble có đang mở để đánh dấu đã đọc
  const isChatActiveRef = useRef(isOpen && !showChatList);
  useEffect(() => {
    isChatActiveRef.current = isOpen && !showChatList;
  }, [isOpen, showChatList]);

  /* ---------- GỌI HOOK CHUNG ---------- */
  const chatLogic = useChat(currentUserId, isChatActiveRef);

  /* ---------- XỬ LÝ SỰ KIỆN MỞ CHAT TỪ NGOÀI ---------- */
  useEffect(() => {
    const handleOpenChatFromExternal = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId: string;
        userName: string;
        conversationId?: string | null;
      }>;
      const { userId, userName, conversationId } = customEvent.detail;
      setIsOpen(true);
      setIsMinimized(false);
      setShowChatList(false);

      const existingChat = conversationId
        ? chatLogic.conversations.find(
            (c) => String(c.conversationId) === String(conversationId),
          )
        : chatLogic.conversations.find(
            (c) => String(c.otherPerson?.userId) === String(userId),
          );

      if (existingChat) {
        chatLogic.handleChatSelect(existingChat);
      } else {
        chatLogic.setSelectedChat({
          conversationId: conversationId || null,
          conversationType: "DIRECT",
          conversationTitle: null,
          user1: { userId: currentUserId!, userName: user?.userName || "" },
          user2: { userId, userName },
          otherPerson: { userId, userName },
          lastMessage: "",
          updatedAt: new Date().toISOString(),
        });
        chatLogic.setMessages([]);
      }
    };

    window.addEventListener("OPEN_CHAT_WITH_USER", handleOpenChatFromExternal);
    return () =>
      window.removeEventListener(
        "OPEN_CHAT_WITH_USER",
        handleOpenChatFromExternal,
      );
  }, [chatLogic.conversations, currentUserId, user]);

  if (window.location.pathname === "/chat") return null;

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center relative"
          >
            <FaCommentDots size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border ${isMinimized ? "w-72 h-14" : "w-[330px] h-[500px] max-h-[calc(100vh-110px)]"}`}
        >
          <div className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              {!showChatList && (
                <button
                  onClick={() => setShowChatList(true)}
                  className="hover:bg-blue-700 p-1 rounded-full transition-colors"
                >
                  <FaArrowLeft size={14} />
                </button>
              )}
              <span className="font-semibold truncate max-w-[180px]">
                {showChatList
                  ? "Đoạn chat"
                  : chatLogic.selectedChat?.conversationType === "CLASS_GROUP"
                    ? chatLogic.selectedChat?.conversationTitle || "Nhóm lớp"
                    : chatLogic.selectedChat?.otherPerson?.userName ||
                      "Người dùng"}
              </span>
            </div>
            <div className="flex gap-2">
              {!showChatList && (
                <button
                  type="button"
                  disabled={chatLogic.deletingConversation}
                  onClick={() => {
                    const confirmed = window.confirm(
                      "Bạn có chắc muốn xóa cuộc trò chuyện này không?",
                    );
                    if (!confirmed) {
                      return;
                    }

                    chatLogic.handleDeleteConversation();
                    setShowChatList(true);
                  }}
                >
                  <FaTrashAlt size={12} />
                </button>
              )}
              <button onClick={() => setIsMinimized(!isMinimized)}>
                <FaMinus size={12} />
              </button>
              <button onClick={() => setIsOpen(false)}>
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {showChatList ? (
                <ChatList
                  {...chatLogic}
                  onChatSelect={(chat) => {
                    chatLogic.handleChatSelect(chat);
                    setShowChatList(false);
                  }}
                  showSettingsMenu={showSettingsMenu}
                  setShowSettingsMenu={setShowSettingsMenu}
                  settingsMenuRef={settingsMenuRef}
                  onDeleteConversation={chatLogic.handleDeleteConversationById}
                  deletingConversationId={chatLogic.deletingConversationId}
                  error={null}
                />
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <MessageList
                    messages={chatLogic.messages}
                    messagesEndRef={chatLogic.messagesEndRef}
                    currentUserId={currentUserId}
                    conversationType={chatLogic.selectedChat?.conversationType}
                  />
                  <MessageInput
                    {...chatLogic}
                    imagePreview={null}
                    setImagePreview={() => {}}
                    isRecording={false}
                    onVoiceRecord={() => {}}
                    onFileSelect={(e: ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file)
                        chatLogic.setSelectedFiles([
                          { file, dataURL: URL.createObjectURL(file) },
                        ]);
                    }}
                    onRemoveFile={() => chatLogic.setSelectedFiles([])}
                    onRemoveImagePreview={() => {}}
                    onClearAllFiles={() => chatLogic.setSelectedFiles([])}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBubble;
