import React, { useState } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import Button from './Button';
import { format } from 'date-fns';

interface UserProfileProps {
  user: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => Promise<void>;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [status, setStatus] = useState(user.status);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({ username, avatar_url: avatarUrl, status });
      onClose();
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ICONS.Close className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.focus()}>
                <img 
                  src={avatarUrl || 'https://via.placeholder.com/100'} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 group-hover:border-blue-100 transition-colors"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all flex items-center justify-center">
                  <ICONS.Settings className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
                maxLength={30}
              />
              <p className="mt-1 text-xs text-slate-400 font-mono">ID: {user.id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
              <div className="flex gap-2">
                  <input
                    id="avatar-input"
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                  <button 
                      type="button"
                      onClick={generateRandomAvatar}
                      className="px-3 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors text-sm font-medium flex items-center gap-2"
                      title="Generate Random Avatar"
                  >
                      <ICONS.Refresh className="w-4 h-4" />
                      Random
                  </button>
              </div>
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                  <option value="online">Online</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Appear Offline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Seen</label>
              <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600 text-sm">
                {user.last_seen ? format(new Date(user.last_seen), 'PPpp') : 'N/A'}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" form="profile-form" isLoading={isLoading} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;