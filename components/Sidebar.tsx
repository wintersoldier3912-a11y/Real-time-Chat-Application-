import React from 'react';
import { ICONS } from '../constants';
import { Room, User } from '../types';
import { format } from 'date-fns';

interface SidebarProps {
  currentUser: User;
  rooms: Room[];
  users: User[];
  activeRoomId: number | null;
  onSelectRoom: (roomId: number) => void;
  onLogout: () => void;
  onOpenAnalytics: () => void;
  onOpenProfile: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  rooms,
  users,
  activeRoomId,
  onSelectRoom,
  onLogout,
  onOpenAnalytics,
  onOpenProfile,
  isOpen,
  onCloseMobile
}) => {
  // Helper to get room display name/icon
  const getRoomMeta = (room: Room) => {
    if (room.is_group) {
      return { name: room.name, avatar: null, status: null };
    }
    // For direct messages, find the other user
    const otherUserId = room.members.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherUserId);
    return {
      name: otherUser?.username || 'Unknown User',
      avatar: otherUser?.avatar_url,
      status: otherUser?.status
    };
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <ICONS.MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg text-slate-900">Nexus</h1>
          </div>
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <ICONS.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <ICONS.Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {rooms.map(room => {
            const meta = getRoomMeta(room);
            const isActive = activeRoomId === room.id;
            
            return (
              <button
                key={room.id}
                onClick={() => {
                  onSelectRoom(room.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  {meta.avatar ? (
                    <img src={meta.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                      <ICONS.Users className="w-5 h-5" />
                    </div>
                  )}
                  {meta.status && (
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      meta.status === 'online' ? 'bg-green-500' : 
                      meta.status === 'busy' ? 'bg-red-500' : 'bg-slate-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-medium truncate ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                      {meta.name}
                    </h3>
                    {room.last_message && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {format(new Date(room.last_message.timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${
                    room.unread_count > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'
                  }`}>
                    {room.last_message ? room.last_message.content : 'No messages yet'}
                  </p>
                </div>
                
                {room.unread_count > 0 && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{room.unread_count}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-slate-50">
            <div className="relative cursor-pointer" onClick={onOpenProfile}>
              <img src={currentUser.avatar_url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full bg-white object-cover hover:opacity-80 transition-opacity" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-50 ${
                currentUser.status === 'online' ? 'bg-green-500' :
                currentUser.status === 'busy' ? 'bg-red-500' : 'bg-slate-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenProfile}>
              <p className="text-sm font-medium text-slate-900 truncate hover:text-blue-600 transition-colors">{currentUser.username}</p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {currentUser.status}
              </p>
            </div>
            
            <div className="flex gap-1">
              <button onClick={onOpenProfile} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Settings">
                <ICONS.Settings className="w-5 h-5" />
              </button>
              <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Logout">
                <ICONS.LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <button 
            onClick={onOpenAnalytics}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ICONS.Analytics className="w-4 h-4" />
            View Analytics
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;