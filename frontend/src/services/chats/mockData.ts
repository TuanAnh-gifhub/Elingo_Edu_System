// Mock Data for ChatBox - Template data for frontend development

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

// Mock Users
export const mockUsers: User[] = [
  {
    userId: 'user1',
    fullName: 'Nguyễn Văn A',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=4da6ff&color=fff'
  },
  {
    userId: 'user2',
    fullName: 'Trần Thị B',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=10b981&color=fff'
  },
  {
    userId: 'user3',
    fullName: 'Lê Văn C',
    avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=f59e0b&color=fff'
  },
  {
    userId: 'user4',
    fullName: 'Phạm Thị D',
    avatar: 'https://ui-avatars.com/api/?name=Pham+Thi+D&background=ef4444&color=fff'
  }
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    conversationId: 'conv1',
    lastMessage: 'Xin chào! Bạn có thể cho tôi biết thêm về phòng học này không?',
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 phút trước
    seller: mockUsers[0],
    buyer: mockUsers[1],
    listing: {
      item: {
        title: 'Phòng học Lab Công nghệ'
      }
    }
  },
  {
    conversationId: 'conv2',
    lastMessage: 'Cảm ơn bạn đã liên hệ!',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 phút trước
    seller: mockUsers[2],
    buyer: mockUsers[1],
    listing: {
      item: {
        title: 'Phòng học nhóm 20 người'
      }
    }
  },
  {
    conversationId: 'conv3',
    lastMessage: 'Phòng này có máy lạnh không ạ?',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 giờ trước
    seller: mockUsers[3],
    buyer: mockUsers[1],
    listing: {
      item: {
        title: 'Phòng thuyết trình hiện đại'
      }
    }
  }
];

// Mock Messages for each conversation
export const mockMessages: Record<string, Message[]> = {
  conv1: [
    {
      messageId: 'msg1',
      senderId: 'user1',
      content: 'Xin chào! Bạn có thể cho tôi biết thêm về phòng học này không?',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      isRead: true
    },
    {
      messageId: 'msg2',
      senderId: 'currentUser',
      content: 'Chào bạn! Phòng học này có đầy đủ thiết bị hiện đại, có thể chứa 20-30 người.',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      isRead: true
    },
    {
      messageId: 'msg3',
      senderId: 'user1',
      content: 'Vậy giá thuê là bao nhiêu ạ?',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isRead: false
    }
  ],
  conv2: [
    {
      messageId: 'msg4',
      senderId: 'currentUser',
      content: 'Xin chào! Tôi muốn đặt phòng học này.',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      isRead: true
    },
    {
      messageId: 'msg5',
      senderId: 'user2',
      content: 'Cảm ơn bạn đã liên hệ! Bạn muốn đặt vào thời gian nào?',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: true
    }
  ],
  conv3: [
    {
      messageId: 'msg6',
      senderId: 'user3',
      content: 'Phòng này có máy lạnh không ạ?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isRead: false
    }
  ]
};

// Helper function to get current user ID from localStorage
export const getCurrentUserId = (): string => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo) as { userId: string };
      return user.userId;
    }
  } catch {
    // Fallback to demo user
  }
  return 'currentUser'; // Default demo user ID
};

// Helper function to generate avatar SVG
export const generateAvatarSVG = (name: string, userId: string | null = null): string => {
  const letter = name.charAt(0).toUpperCase();
  const color = userId 
    ? `hsl(${parseInt(userId.slice(0, 8) || '0', 16) % 360}, 70%, 60%)`
    : '#10b981';
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/><text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dy=".3em" font-family="Arial">${letter}</text></svg>`;
};
