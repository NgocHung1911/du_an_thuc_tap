import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { userApi } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import { notificationApi, NotificationDTO } from '../../services/notificationApi';
import { NotificationDropdown } from './NotificationDropdown';
import { Bell, HelpCircle, Kanban } from 'lucide-react';

import { useNotificationWebSocket } from '../../hooks/useWebSocket';
import { UserAvatar } from '../common/UserAvatar';

export const MainLayout: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  useEffect(() => {
    userApi.getCurrentUser()
      .then(data => setProfile(data))
      .catch(err => console.error('Failed to load profile in header:', err));

    notificationApi.getNotifications()
      .then(data => setNotifications(data))
      .catch(err => console.error('Failed to load notifications:', err));

    notificationApi.getUnreadCount()
      .then(count => setUnreadCount(count))
      .catch(err => console.error('Failed to load unread count:', err));
  }, []);

  useNotificationWebSocket((event) => {
    if (event.eventType === 'USER_AVATAR_UPDATED' || event.type === 'USER_AVATAR_UPDATED') {
      if (event.data?.avatarUrl) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: event.data.avatarUrl } : event.data));
      }
    }

    if (event.eventType === 'NOTIFICATION_CREATED' || event.type === 'NOTIFICATION_CREATED') {
      if (event.data) {
        const newNotif = event.data as NotificationDTO;
        setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      }
    }
  });

  const displayName = profile?.fullName || profile?.username || user?.username || 'User';

  const checkIsRead = (n: any) => Boolean(n?.isRead || n?.read);

  const safeUnreadCount = (Array.isArray(notifications) ? notifications : []).filter(
    (n) =>
      n.type !== 'TASK_UPDATED' &&
      n.type !== 'TASK_STATUS_CHANGED' &&
      n.type !== 'TASK_PRIORITY_CHANGED' &&
      Boolean(n.message && n.message.trim()) &&
      !checkIsRead(n)
  ).length;

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-5 shadow-sm z-10 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Kanban size={18} />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Kira Task Management</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white relative"
              title="Thông báo"
            >
              <Bell size={18} />
              {safeUnreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                  {safeUnreadCount > 99 ? '99+' : safeUnreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              notifications={notifications}
              setNotifications={setNotifications}
              unreadCount={safeUnreadCount}
              setUnreadCount={setUnreadCount}
            />
          </div>

          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title="Help">
            <HelpCircle size={18} />
          </button>

          <div className="h-5 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <UserAvatar
              src={profile?.avatarUrl}
              name={displayName}
              size="w-8 h-8"
              className="border border-blue-400/30"
              textSize="text-xs"
            />
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{displayName}</span>
          </div>
        </div>
      </header>

      {/* Body Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Automatic Sidebar dispatch based on Role */}
        {isAdmin ? <AdminSidebar /> : <MemberSidebar />}

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

