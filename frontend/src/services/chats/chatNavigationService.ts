import type { NavigateFunction } from "react-router-dom";
import chatService, { type ConversationResponse } from "./chatService";

const resolveConversationId = (conversation: ConversationResponse): string => {
  if (!conversation.conversationId) {
    throw new Error("Không thể mở chat vì conversationId không hợp lệ.");
  }
  return conversation.conversationId;
};

export const openPrivateChatWithUser = async (
  navigate: NavigateFunction,
  targetUserId: string,
) => {
  const response = await chatService.createPrivateConversation(targetUserId);
  const conversationId = resolveConversationId(response.result);

  navigate("/chat", {
    state: {
      conversationId,
      chatType: "PRIVATE",
    },
  });
};

export const openClassGroupChat = async (
  navigate: NavigateFunction,
  classId: string,
) => {
  const response = await chatService.createClassGroupConversation(classId);
  const conversationId = resolveConversationId(response.result);

  navigate("/chat", {
    state: {
      conversationId,
      chatType: "GROUP",
      classId,
    },
  });
};

