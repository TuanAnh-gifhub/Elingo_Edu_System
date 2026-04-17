import React from "react";
import { type MessageResponse } from "../../../services/chats/chatService";
import { parseMessageContent } from "../../../services/upload/uploadService";
import { FaUserCircle } from "react-icons/fa";

// ============ TYPE DEFINITIONS ============

export interface Message extends MessageResponse {
  sender: "user" | "other";
}

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showBackground?: boolean;
  currentUserId: string | null;
  conversationType?: "DIRECT" | "CLASS_GROUP";
  isDarkMode?: boolean;
}

interface MessageGroup {
  messages: Message[];
  sender: "user" | "other";
}

// ============ UTILITsY FUNCTIONS ============

const MessageList = ({
  messages,
  messagesEndRef,
  currentUserId,
  conversationType,
  isDarkMode = false,
}: MessageListProps) => {
  const isGroupConversation = conversationType === "CLASS_GROUP";

  const groupConsecutiveMessages = (msgs: Message[]): MessageGroup[] => {
    const grouped: MessageGroup[] = [];
    if (msgs.length === 0) return grouped;

    const TIME_THRESHOLD = 15 * 60 * 1000; // 15 phút

    let currentGroup: MessageGroup = {
      messages: [msgs[0]],
      sender: String(msgs[0].senderId) === currentUserId ? "user" : "other",
    };

    for (let i = 1; i < msgs.length; i++) {
      const msg = msgs[i];
      const prevMsg = msgs[i - 1];
      const senderType =
        String(msg.senderId) === currentUserId ? "user" : "other";

      const timeDiff =
        new Date(msg.createdAt).getTime() -
        new Date(prevMsg.createdAt).getTime();

      if (senderType === currentGroup.sender && timeDiff < TIME_THRESHOLD) {
        currentGroup.messages.push(msg);
      } else {
        grouped.push(currentGroup);
        currentGroup = {
          messages: [msg],
          sender: senderType,
        };
      }
    }
    grouped.push(currentGroup);
    return grouped;
  };

  const groupedMessages = groupConsecutiveMessages(messages);

  return (
    <div
      className={`flex-1 overflow-y-auto px-1.5 py-3 space-y-3 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {groupedMessages.map((group, groupIndex) => {
        const isMe = group.sender === "user";

        return (
          <div
            key={groupIndex}
            className={`flex ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2 mb-1.5`}
          >
            {!isMe && (
              <div className="flex-shrink-0 mb-5">
                <FaUserCircle className="text-gray-400 w-8 h-8" />
              </div>
            )}

            <div
              className={`flex flex-col max-w-[75%] ${
                isMe ? "items-end" : "items-start"
              }`}
            >
              {!isMe && isGroupConversation ? (
                <p className="mb-1 px-1 text-xs font-semibold text-slate-500">
                  {group.messages[0]?.senderName || "Thành viên"}
                </p>
              ) : null}
              <div className="flex flex-col w-full">
                {group.messages.map((message, idx) => {
                  const parsed = parseMessageContent(message.content) as any;

                  const isFirst = idx === 0;
                  const isLast = idx === group.messages.length - 1;

                  const hasImage = !!message.imageUrl;
                  // Xác định text thực sự: Ưu tiên parsed.text, nếu không thì lấy message.content.
                  // Dùng .trim() để loại bỏ trường hợp chỉ có dấu cách.
                  const actualText = (
                    parsed.text ||
                    message.content ||
                    ""
                  ).trim();
                  const hasText = actualText.length > 0;

                  // LÀM LẠI LOGIC isMediaOnly: Chỉ có ảnh và hoàn toàn không có text
                  const isMediaOnly = hasImage && !hasText;

                  let borderRadiusClass = isMe
                    ? group.messages.length === 1
                      ? "rounded-2xl rounded-br-none"
                      : isFirst
                        ? "rounded-2xl rounded-br-sm mb-[2px]"
                        : isLast
                          ? "rounded-2xl rounded-tr-sm rounded-br-none"
                          : "rounded-2xl rounded-tr-sm rounded-br-sm mb-[2px]"
                    : group.messages.length === 1
                      ? "rounded-2xl rounded-bl-none"
                      : isFirst
                        ? "rounded-2xl rounded-bl-sm mb-[2px]"
                        : isLast
                          ? "rounded-2xl rounded-tl-sm rounded-bl-none"
                          : "rounded-2xl rounded-tl-sm rounded-bl-sm mb-[2px]";

                  return (
                    <div
                      key={message.messageId}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} w-full`}
                    >
                      <div
                        className={`relative transition-all w-fit max-w-[100%] ${
                          isMe ? "ml-auto" : "mr-auto"
                        } ${
                          isMediaOnly
                            ? "p-0 bg-transparent shadow-none" // Ẩn nền nếu chỉ có ảnh
                            : `px-2.5 py-1.5 shadow-sm ${borderRadiusClass} ${
                                isMe
                                  ? "bg-blue-600 text-white"
                                  : isDarkMode
                                    ? "bg-gray-800 text-white"
                                    : "bg-white text-gray-800 border border-gray-200"
                              }`
                        }`}
                      >
                        {hasImage && (
                          <div
                            // Nếu có text thì mới tạo margin-bottom để cách text ra
                            className={`${!isMediaOnly ? "mb-2" : ""}`}
                          >
                            <img
                              src={message.imageUrl!}
                              alt="Sent attachment"
                              className={`max-w-[240px] cursor-pointer hover:opacity-95 transition-opacity shadow-md object-cover ${
                                isMediaOnly ? borderRadiusClass : "rounded-lg"
                              }`}
                              onClick={() =>
                                window.open(message.imageUrl!, "_blank")
                              }
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* CHỈ RENDER TEXT NẾU CÓ TEXT THẬT SỰ */}
                        {hasText && (
                          <p className="whitespace-pre-wrap leading-snug text-[13px]">
                            {actualText}
                          </p>
                        )}
                      </div>

                      {/* HIỂN THỊ THỜI GIAN VÀ TRẠNG THÁI */}
                      {isLast && (
                        <div
                          className={`flex items-center mt-0.5 text-[10px] font-medium text-gray-400 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>

                          {isMe && (
                            <>
                              <span className="mx-1">•</span>
                              <span
                                className={
                                  message.status === "READ"
                                    ? "text-blue-500"
                                    : ""
                                }
                              >
                                {message.status === "READ"
                                  ? "Đã xem"
                                  : "Đã gửi"}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
