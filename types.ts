// User & Auth Types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'busy';
  last_seen: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Chat Types
export interface Room {
  id: number;
  name: string;
  is_group: boolean;
  last_message?: Message;
  unread_count: number;
  members: number[]; // User IDs
}

export interface Message {
  id: string;
  room_id: number;
  sender_id: number;
  content: string;
  timestamp: string;
  delivered: boolean;
  read_by: number[];
}

export interface TypingEvent {
  room_id: number;
  user_id: number;
  is_typing: boolean;
}

// Analytics Data Types
export interface AnalyticsData {
  messagesPerHour: { hour: string; count: number }[];
  activeUsers: number;
  totalMessages: number;
}
