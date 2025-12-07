import React, { useState, useEffect } from 'react';
import { ICONS } from './constants';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Analytics from './components/Analytics';
import UserProfile from './components/UserProfile';
import { User, Room, Message } from './types';
import { mockService } from './services/mockService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Initial Data Fetch on Login
  useEffect(() => {
    if (user) {
      mockService.connect(); // Start "WebSocket"

      Promise.all([
        mockService.getRooms(),
        mockService.getUsers()
      ]).then(([fetchedRooms, fetchedUsers]) => {
        setRooms(fetchedRooms);
        setUsers(fetchedUsers);
      });
    }
  }, [user?.id]); // Only run when user ID changes (login), not on every user object update

  // WebSocket Event Listeners
  useEffect(() => {
    if (!user) return;

    // Listen for incoming messages global event
    const unsubMsg = mockService.on('new_message', (msg: Message) => {
      // Update rooms to show new message/unread
      setRooms(prev => prev.map(r => {
        if (r.id === msg.room_id) {
          return {
            ...r,
            last_message: msg,
            unread_count: (activeRoomId === r.id) ? 0 : r.unread_count + 1
          };
        }
        return r;
      }));

      // If message belongs to active room, append to messages
      if (activeRoomId === msg.room_id) {
          setMessages(prev => [...prev, msg]);
          // Mark as read immediately if we are in this room
          mockService.markAsRead(activeRoomId, user.id);
      }
    });

    // Listen for presence/profile updates
    const unsubPresence = mockService.on('presence_update', (updatedUser: User) => {
      // Update user list
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      // Update current user state if it's me
      if (user.id === updatedUser.id) {
        setUser(updatedUser);
      }
    });

    // Listen for read receipts
    const unsubRead = mockService.on('messages_read', (data: { room_id: number, read_by_user_id: number, message_ids: string[] }) => {
      if (activeRoomId === data.room_id) {
        setMessages(prev => prev.map(m => {
          if (data.message_ids.includes(m.id)) {
            // Avoid duplicate additions
            const newReadBy = m.read_by.includes(data.read_by_user_id) 
              ? m.read_by 
              : [...m.read_by, data.read_by_user_id];
            return { ...m, read_by: newReadBy };
          }
          return m;
        }));
      }
    });

    return () => {
      unsubMsg();
      unsubPresence();
      unsubRead();
    };
  }, [user, activeRoomId]);

  // Fetch messages when room changes
  useEffect(() => {
    if (activeRoomId && user) {
      mockService.getMessages(activeRoomId).then(msgs => {
        setMessages(msgs);
        // Mark messages as read when entering room
        mockService.markAsRead(activeRoomId, user.id);
      });
      
      // Reset unread count locally
      setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, unread_count: 0 } : r));
    }
  }, [activeRoomId, user]);


  const handleSendMessage = (content: string) => {
    if (activeRoomId) {
      mockService.sendMessage(activeRoomId, content);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        // We only call the service. The service emits 'presence_update'.
        // The useEffect listener above will handle updating the local state (setUser and setUsers).
        // This confirms the "real-time" loop.
        await mockService.updateUser(user.id, updates);
      } catch (err) {
        console.error("Failed to update profile", err);
      }
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar 
        currentUser={user}
        rooms={rooms}
        users={users}
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        onLogout={() => setUser(null)}
        onOpenAnalytics={() => setShowAnalytics(true)}
        onOpenProfile={() => setShowProfile(true)}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {activeRoom ? (
          <ChatWindow 
            room={activeRoom}
            messages={messages}
            currentUser={user}
            onSendMessage={handleSendMessage}
            roomUsers={users}
            onBack={() => {
              setActiveRoomId(null);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-4 bg-slate-50 relative">
             {/* Mobile Header for empty state to open menu */}
             <div className="md:hidden absolute top-0 left-0 right-0 p-4 flex items-center h-16 border-b border-slate-200 bg-white w-full">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600">
                  <ICONS.Menu className="w-6 h-6" />
                </button>
                <span className="ml-4 font-bold text-lg text-slate-900">Nexus Chat</span>
             </div>

            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ICONS.MessageSquare className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome, {user.username}!</h2>
            <p className="text-slate-500 max-w-md">
              Select a conversation from the sidebar to start messaging.
            </p>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="mt-8 md:hidden px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-transform"
            >
              View Chats
            </button>
          </div>
        )}
      </main>

      {showAnalytics && <Analytics onClose={() => setShowAnalytics(false)} />}
      
      {showProfile && (
        <UserProfile 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onSave={handleUpdateProfile} 
        />
      )}
    </div>
  );
}

export default App;