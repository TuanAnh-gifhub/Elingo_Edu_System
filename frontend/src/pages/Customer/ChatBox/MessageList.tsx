import { FaMicrophone } from "react-icons/fa";
// TEMPLATE MODE: Background image - create if needed
// import backgroundMesseger from "../../../assets/img/background_messeger.png";
const backgroundMesseger = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3C/svg%3E";
import { parseMessageContent } from "../../../services/upload/uploadService";
import { normalizeImageUrl } from "../../../utils/imageUrlHelper";

interface Message {
  id: string | number;
  sender: 'user' | 'other';
  content: string;
  createdAt: string;
  isRead?: boolean;
  isVoice?: boolean;
  files?: Array<{
    file: File;
    dataURL?: string;
  }>;
}

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showBackground?: boolean;
  isDarkMode?: boolean;
}

interface MediaData {
  type: 'image' | 'video' | 'multiple';
  url: string;
  text?: string;
  metadata?: {
    thumbnail?: string;
    format?: string;
    width?: number;
    height?: number;
    size?: number;
    duration?: number;
  };
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    metadata?: {
      thumbnail?: string;
      format?: string;
    };
  }>;
}

interface MessageGroup {
  messages: Message[];
  sender: 'user' | 'other';
  isLastInGroup: boolean;
}

// Utility function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function for formatting time display
const formatMessageTime = (createdAt: string): string => {
  const messageTime = new Date(createdAt);
  return messageTime.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Component to render media content (image/video)
interface MediaContentProps {
  mediaData: MediaData;
  isDarkMode: boolean;
}

const MediaContent = ({ mediaData, isDarkMode }: MediaContentProps) => {
  const { type, url, text, metadata } = mediaData;
  
  // Normalize URLs
  const normalizedUrl = normalizeImageUrl(url);
  const normalizedThumbnail = metadata?.thumbnail ? normalizeImageUrl(metadata.thumbnail) : null;
  
  if (type === 'image') {
    return (
      <div className="space-y-2">
        <img
          src={normalizedUrl}
          alt={text || 'Image'}
          className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxWidth: '300px', maxHeight: '300px' }}
          onClick={() => window.open(normalizedUrl, '_blank')}
        />
        {text && <p className={`text-sm mt-2 ${isDarkMode ? 'text-white' : ''}`}>{text}</p>}
      </div>
    );
  }
  
  if (type === 'video') {
    return (
      <div className="space-y-2">
        <video
          controls
          className="rounded-lg max-w-full h-auto"
          style={{ maxWidth: '300px', maxHeight: '300px' }}
          poster={normalizedThumbnail || undefined}
        >
          <source src={normalizedUrl} type={`video/${metadata?.format || 'mp4'}`} />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
        {text && <p className={`text-sm mt-2 ${isDarkMode ? 'text-white' : ''}`}>{text}</p>}
      </div>
    );
  }
  
  if (type === 'multiple') {
    return (
      <div className="space-y-2">
        {mediaData.media && mediaData.media.map((item, index) => {
          const normalizedItemUrl = normalizeImageUrl(item.url);
          const normalizedItemThumbnail = item.metadata?.thumbnail ? normalizeImageUrl(item.metadata.thumbnail) : null;
          
          return (
            <div key={index}>
              {item.type === 'image' ? (
                <img
                  src={normalizedItemUrl}
                  alt={`Image ${index + 1}`}
                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                  onClick={() => window.open(normalizedItemUrl, '_blank')}
                />
              ) : item.type === 'video' ? (
                <video
                  controls
                  className="rounded-lg max-w-full h-auto"
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                  poster={normalizedItemThumbnail || undefined}
                >
                  <source src={normalizedItemUrl} type={`video/${item.metadata?.format || 'mp4'}`} />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              ) : null}
            </div>
          );
        })}
        {text && <p className={`text-sm mt-2 ${isDarkMode ? 'text-white' : ''}`}>{text}</p>}
      </div>
    );
  }
  
  // Fallback for unknown types
  return <p className={`text-sm ${isDarkMode ? 'text-white' : ''}`}>{text || 'Unsupported media type'}</p>;
};

const MessageList = ({ messages, messagesEndRef, showBackground = true, isDarkMode = false }: MessageListProps) => {
  // Group consecutive messages from the same sender
  const groupConsecutiveMessages = (messages: Message[]): MessageGroup[] => {
    const grouped: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;
    
    messages.forEach((message, index) => {
      const nextMessage = messages[index + 1];
      const prevMessage = messages[index - 1];
      
      // Check if this message starts a new group
      const isNewGroup = !prevMessage || 
                        prevMessage.sender !== message.sender ||
                        (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 2 * 60 * 1000; // 2 minutes gap
      
      if (isNewGroup) {
        currentGroup = {
          messages: [message],
          sender: message.sender,
          isLastInGroup: !nextMessage || nextMessage.sender !== message.sender
        };
        grouped.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.messages.push(message);
        currentGroup.isLastInGroup = !nextMessage || nextMessage.sender !== message.sender;
      }
    });
    
    return grouped;
  };

  const groupedMessages = groupConsecutiveMessages(messages);

  return (
    <div 
      className={`flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide ${isDarkMode ? 'bg-gray-900' : ''}`}
      style={showBackground && !isDarkMode ? {
        backgroundImage: `url(${backgroundMesseger})`,
        backgroundSize: '100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {groupedMessages.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={`flex ${group.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className="max-w-[70%] space-y-1">
            {group.messages.map((message, messageIndex) => {
              const parsedContent = parseMessageContent(message.content) as MediaData & { isMedia: boolean; text: string };
              const isMedia = parsedContent.isMedia;
              return (
              <div
                key={message.id}
                className={`${isMedia ? 'p-0' : 'px-4 py-3'} rounded-2xl ${
                  group.sender === 'user'
                    ? (isMedia ? (isDarkMode ? 'text-white' : 'text-black') : `${isDarkMode ? 'text-white' : 'text-black'} shadow-lg border`)
                    : (isMedia 
                        ? (isDarkMode ? 'text-white' : 'text-black') 
                        : `${isDarkMode ? 'bg-gray-700 text-white border border-gray-600 shadow-sm' : 'bg-gray-300 text-black border border-gray-400 shadow-sm'}`)
                } ${
                  messageIndex > 0 ? 'mt-1' : ''
                }`}
                style={(group.sender === 'user' && !isMedia) ? {
                  backgroundColor: '#4da6ff',
                  borderColor: '#4da6ff'
                } : {}}
              >
                {message.isVoice ? (
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <FaMicrophone className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{message.content}</span>
                    <span className="text-xs opacity-70">0:03</span>
                  </div>
                ) : (
                  parsedContent.isMedia 
                    ? <MediaContent mediaData={parsedContent} isDarkMode={isDarkMode} />
                    : <p className={`text-sm ${isDarkMode ? 'text-white' : ''}`}>{parsedContent.text}</p>
                )}
                
                {/* File attachments */}
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.files.map((fileItem, index) => (
                      <div key={index}>
                        {fileItem.dataURL ? (
                          <img
                            src={fileItem.dataURL}
                            alt={fileItem.file.name}
                            className="max-w-full h-auto"
                            style={{ maxWidth: '300px', maxHeight: '300px' }}
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-white/20 rounded-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            <span className="text-xs truncate">{fileItem.file.name}</span>
                            <span className="text-xs opacity-70">({formatFileSize(fileItem.file.size)})</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );})}
            
            {/* Show timestamp and read receipt only for the last message in group */}
            {group.messages.length > 0 && (
              <div className={`flex items-center mt-1 gap-1 ${isDarkMode ? 'text-white' : 'text-black'} ${
                group.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span className="text-xs">
                  {formatMessageTime(group.messages[group.messages.length - 1].createdAt)}
                </span>
                {group.sender === 'user' && (
                  <span className="text-xs ml-1">
                    {group.messages[group.messages.length - 1].isRead 
                      ? 'Đã xem' 
                      : 'Đã nhận'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
