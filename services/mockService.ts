import { User, Room, Message, AuthResponse, AnalyticsData } from '../types';

// Mock Data
const MOCK_USERS: User[] = [
  { id: 1, username: 'Current User', email: 'me@example.com', status: 'online', last_seen: new Date().toISOString(), avatar_url: 'https://picsum.photos/200' },
  { id: 2, username: 'Alice Johnson', email: 'alice@example.com', status: 'online', last_seen: new Date().toISOString(), avatar_url: 'https://picsum.photos/201' },
  { id: 3, username: 'Bob Smith', email: 'bob@example.com', status: 'offline', last_seen: new Date(Date.now() - 3600000).toISOString(), avatar_url: 'https://picsum.photos/202' },
  { id: 4, username: 'Charlie Brown', email: 'charlie@example.com', status: 'busy', last_seen: new Date().toISOString(), avatar_url: 'https://picsum.photos/203' },
];

const INITIAL_ROOMS: Room[] = [
  { id: 101, name: 'General Chat', is_group: true, unread_count: 2, members: [1, 2, 3, 4] },
  { id: 102, name: 'Alice Johnson', is_group: false, unread_count: 0, members: [1, 2] },
  { id: 103, name: 'Bob Smith', is_group: false, unread_count: 0, members: [1, 3] },
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', room_id: 101, sender_id: 2, content: 'Welcome to the team!', timestamp: new Date(Date.now() - 86400000).toISOString(), delivered: true, read_by: [1, 3, 4] },
  { id: 'm2', room_id: 102, sender_id: 2, content: 'Hey, do you have the report?', timestamp: new Date(Date.now() - 3600000).toISOString(), delivered: true, read_by: [1] },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockService {
  private users = MOCK_USERS;
  private rooms = INITIAL_ROOMS;
  private messages = INITIAL_MESSAGES;
  private currentUser: User | null = null;
  private listeners: { [event: string]: Function[] } = {};

  constructor() {
    // Load from local storage if available to persist state across refreshes
    const savedMsgs = localStorage.getItem('nexus_messages');
    if (savedMsgs) {
      this.messages = JSON.parse(savedMsgs);
    }
  }

  // --- Auth API ---

  async login(email: string): Promise<AuthResponse> {
    await delay(800);
    // For demo, just log in as the first user if email matches 'me', else random
    this.currentUser = this.users[0];
    return { token: 'mock-jwt-token', user: this.currentUser };
  }

  async register(email: string, username: string): Promise<AuthResponse> {
    await delay(800);
    const newUser: User = {
      id: Math.floor(Math.random() * 10000) + 10,
      username,
      email,
      status: 'online',
      last_seen: new Date().toISOString(),
      avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${Math.random()}`
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    return { token: 'mock-jwt-token', user: newUser };
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    await delay(500);
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      if (this.currentUser?.id === id) {
        this.currentUser = this.users[index];
      }
      
      // Emit presence update to simulate real-time broadcast to all clients
      this.emit('presence_update', this.users[index]);
      
      return this.users[index];
    }
    throw new Error('User not found');
  }

  // --- Data API ---

  async getRooms(): Promise<Room[]> {
    await delay(300);
    // Enrich rooms with last message
    return this.rooms.map(room => ({
      ...room,
      last_message: this.messages.filter(m => m.room_id === room.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    }));
  }

  async getMessages(roomId: number): Promise<Message[]> {
    await delay(200);
    return this.messages
      .filter(m => m.room_id === roomId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getUsers(): Promise<User[]> {
    await delay(200);
    return this.users;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    await delay(500);
    return {
      activeUsers: this.users.filter(u => u.status !== 'offline').length,
      totalMessages: this.messages.length,
      messagesPerHour: [
        { hour: '09:00', count: 12 },
        { hour: '10:00', count: 45 },
        { hour: '11:00', count: 32 },
        { hour: '12:00', count: 15 },
        { hour: '13:00', count: 50 },
        { hour: '14:00', count: 28 },
      ]
    };
  }

  async markAsRead(roomId: number, userId: number): Promise<void> {
    // Find unread messages for this user in this room (sent by others)
    const unreadMsgs = this.messages.filter(m => 
      m.room_id === roomId && 
      m.sender_id !== userId && 
      !m.read_by.includes(userId)
    );

    if (unreadMsgs.length > 0) {
      // Update local state
      unreadMsgs.forEach(m => {
        if (!m.read_by.includes(userId)) {
          m.read_by.push(userId);
        }
      });
      this.persistMessages();
      
      // Emit event so everyone (especially sender) sees the update
      this.emit('messages_read', { 
        room_id: roomId, 
        read_by_user_id: userId,
        message_ids: unreadMsgs.map(m => m.id)
      });
    }
  }

  // --- WebSocket Simulation ---

  connect() {
    console.log('WS: Connected');
    this.emit('connect', {});
  }

  sendMessage(roomId: number, content: string) {
    if (!this.currentUser) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      room_id: roomId,
      sender_id: this.currentUser.id,
      content,
      timestamp: new Date().toISOString(),
      delivered: true,
      read_by: [this.currentUser.id]
    };

    this.messages.push(newMessage);
    this.persistMessages();
    
    // Broadcast to self immediately (optimistic UI)
    this.emit('new_message', newMessage);

    // Simulate a reply from a "bot" or another user in the room after delay
    this.simulateReply(roomId);
  }

  // Simulate incoming events
  private async simulateReply(roomId: number) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Pick a random other member
    const otherMemberIds = room.members.filter(id => id !== this.currentUser?.id);
    if (otherMemberIds.length === 0) return;

    const senderId = otherMemberIds[Math.floor(Math.random() * otherMemberIds.length)];
    
    // 1. Simulate the other user "reading" the messages before typing
    await delay(800);
    await this.markAsRead(roomId, senderId);

    // 2. Simulate typing
    await delay(500);
    this.emit('typing', { room_id: roomId, user_id: senderId, is_typing: true });
    
    await delay(2000);
    this.emit('typing', { room_id: roomId, user_id: senderId, is_typing: false });

    // 3. Send reply
    const replyMsg: Message = {
      id: `m${Date.now()}_reply`,
      room_id: roomId,
      sender_id: senderId,
      content: this.getRandomReply(),
      timestamp: new Date().toISOString(),
      delivered: true,
      read_by: [senderId]
    };

    this.messages.push(replyMsg);
    this.persistMessages();
    this.emit('new_message', replyMsg);
  }

  private getRandomReply() {
    const replies = [
      "That sounds great!",
      "Can you verify that?",
      "I'll take a look shortly.",
      "Awesome work.",
      "Let's sync up later.",
      "Could you clarify?"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // Event Emitter logic
  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  private persistMessages() {
    localStorage.setItem('nexus_messages', JSON.stringify(this.messages));
  }
}

export const mockService = new MockService();