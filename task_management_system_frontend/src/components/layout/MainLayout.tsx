import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { userApi } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import { notificationApi, NotificationDTO } from '../../services/notificationApi';
import { NotificationDropdown } from './NotificationDropdown';
import { Bell, HelpCircle, Kanban, Globe } from 'lucide-react';

import { useNotificationWebSocket } from '../../hooks/useWebSocket';
import { UserAvatar } from '../common/UserAvatar';
import { SubscriptionSummaryDTO, subscriptionApi } from '../../services/subscriptionApi';
import { SubscriptionPlansModal } from '../subscription/SubscriptionPlansModal';
import { Sparkles, Zap, Crown } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummaryDTO | null>(null);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  const currentLang = (i18n.language || 'vi').startsWith('en') ? 'en' : 'vi';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const fetchSubscriptionSummary = () => {
    subscriptionApi.getMySubscription()
      .then(data => setSubscription(data))
      .catch(err => console.error('Failed to load subscription:', err));
  };

  useEffect(() => {
    userApi.getCurrentUser()
      .then(data => setProfile(data))
      .catch(err => console.error('Failed to load profile in header:', err));

    fetchSubscriptionSummary();

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

    if (event.eventType === 'SUBSCRIPTION_UPDATED' || event.type === 'SUBSCRIPTION_UPDATED') {
      if (event.data) {
        setSubscription(event.data as SubscriptionSummaryDTO);
      } else {
        fetchSubscriptionSummary();
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

  const currentPlan = subscription?.plan || 'STARTER';

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-5 shadow-sm z-10 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Kanban size={18} />
          </div>
          <span className="font-bold text-base tracking-tight text-white">{t('header.title')}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Subscription Badge & Upgrade Button */}
          <div className="flex items-center gap-2 mr-1">
            <button
              onClick={() => setIsPlansModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                currentPlan === 'PRO'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110 shadow-blue-500/20'
                  : currentPlan === 'ENTERPRISE'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:brightness-110 shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {currentPlan === 'PRO' ? (
                <Sparkles size={13} className="text-amber-300" />
              ) : currentPlan === 'ENTERPRISE' ? (
                <Crown size={13} className="text-amber-200" />
              ) : (
                <Zap size={13} className="text-blue-400" />
              )}
              <span>{currentPlan}</span>
              {currentPlan === 'STARTER' && (
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded-md font-semibold ml-0.5">
                  {t('subscription.upgrade_badge', 'Nâng cấp')}
                </span>
              )}
            </button>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 hover:bg-slate-800 rounded-xl transition-all text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-medium border border-slate-700/80 bg-slate-800/40 cursor-pointer"
            title={t('language.select')}
          >
            <Globe size={14} className="text-blue-400" />
            <span className="font-semibold tracking-wide">
              {currentLang === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
            </span>
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white relative"
              title={t('header.notifications')}
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

          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title={t('header.help')}>
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

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        currentSummary={subscription}
        onSubscriptionUpdated={() => {
          fetchSubscriptionSummary();
        }}
      />
    </div>
  );
};

