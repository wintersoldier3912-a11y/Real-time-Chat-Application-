import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Message, User, Room, TypingEvent } from '../types';
import { format, isToday, isYesterday } from 'date-fns';
import { mockService } from '../services/mockService';

interface ChatWindowProps {
  room: Room;
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  roomUsers: User[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  room, 
  messages, 
  currentUser, 
  onSendMessage,
  onBack,
  roomUsers
}) => {
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Listen for typing events
  useEffect(() => {
    const unsubTyping = mockService.on('typing', (data: TypingEvent) => {
      if (data.room_id !== room.id) return;
      
      if (data.is_typing) {
        setTypingUsers(prev => [...new Set([...prev, data.user_id])]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.user_id));
      }
    });

    return () => {
      unsubTyping();
    };
  }, [room.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages by day
  const groupedMessages = messages.reduce((groups, message) => {
    const day = getDayLabel(message.timestamp);
    if (!groups[day]) groups[day] = [];
    groups[day].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  // Meta info for the header
  const isGroup = room.is_group;
  const otherMemberId = room.members.find(id => id !== currentUser.id);
  const otherUser = roomUsers.find(u => u.id === otherMemberId);
  const roomName = isGroup ? room.name : (otherUser?.username || 'Unknown User');
  const statusText = isGroup 
    ? `${room.members.length} members` 
    : otherUser?.status === 'online' ? 'Online' : `Last seen ${otherUser?.last_seen ? format(new Date(otherUser.last_seen), 'HH:mm') : 'recently'}`;

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
            <ICONS.Users className="w-5 h-5 transform rotate-180" /> {/* Simulating back arrow with icon available */}
          </button>
          
          <div className="relative">
            {isGroup ? (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ICONS.Users className="w-5 h-5" />
              </div>
            ) : (
              <img 
                src={otherUser?.avatar_url || 'https://via.placeholder.com/40'} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover" 
              />
            )}
            {!isGroup && otherUser?.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
            )}
          </div>
          
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">{roomName}</h2>
            <p className="text-xs text-slate-500 font-medium">{statusText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <ICONS.Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <ICONS.Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <ICONS.MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scroll-smooth">
        {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
          <div key={dateLabel}>
            <div className="flex justify-center mb-4">
              <span className="px-3 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                {dateLabel}
              </span>
            </div>
            
            <div className="space-y-2">
              {(msgs as Message[]).map((msg, idx) => {
                const isMe = msg.sender_id === currentUser.id;
                const sender = roomUsers.find(u => u.id === msg.sender_id);
                const showAvatar = !isMe && (idx === 0 || msgs[idx - 1].sender_id !== msg.sender_id);
                
                // Determine read status
                // Read: If anyone other than sender has read it (length > 1, assuming sender is always in read_by)
                const isRead = msg.read_by.length > 1;
                
                return (
                  <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                       {/* Avatar for other users */}
                        {!isMe && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar && (
                              <img 
                                src={sender?.avatar_url || 'https://via.placeholder.com/32'} 
                                alt="" 
                                className="w-8 h-8 rounded-full shadow-sm"
                              />
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`
                          relative px-4 py-2 rounded-2xl shadow-sm text-sm
                          ${isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                          }
                        `}>
                          {!isMe && isGroup && showAvatar && (
                             <p className="text-xs font-bold text-blue-600 mb-1">{sender?.username}</p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                            <span>{format(new Date(msg.timestamp), 'HH:mm')}</span>
                            {isMe && (
                              isRead 
                              ? <ICONS.CheckDouble className="w-3.5 h-3.5 text-white" /> // Bright white for Read
                              : msg.delivered
                                ? <ICONS.CheckDouble className="w-3.5 h-3.5 text-blue-300" /> // Faded blue double for Delivered
                                : <ICONS.Check className="w-3.5 h-3.5 text-blue-300" /> // Single for Sent
                            )}
                          </div>
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 ml-10">
             <div className="bg-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
             </div>
             <span className="text-xs text-slate-500">
               {typingUsers.length === 1 
                 ? `${roomUsers.find(u => u.id === typingUsers[0])?.username} is typing...` 
                 : 'Multiple people typing...'}
             </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-5xl mx-auto">
          <button type="button" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <ICONS.Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="w-full pl-4 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!inputValue.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ICONS.Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;