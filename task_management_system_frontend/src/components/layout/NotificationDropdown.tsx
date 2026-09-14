import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  CheckCheck, 
  UserPlus, 
  CheckSquare, 
  MessageSquare, 
  Tag, 
  AlertCircle, 
  Clock, 
  X
} from 'lucide-react';
import { notificationApi, NotificationDTO } from '../../services/notificationApi';
import { UserAvatar } from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationDTO[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationDTO[]>>;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  onNotificationClick?: (notification: NotificationDTO) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications = [],
  setNotifications,
  unreadCount = 0,
  setUnreadCount,
  onNotificationClick
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const checkIsRead = (n: any) => Boolean(n?.isRead || n?.read);

  const safeNotifications = (Array.isArray(notifications) ? notifications : [])
    .filter(n => 
      n.type !== 'TASK_UPDATED' && 
      n.type !== 'TASK_STATUS_CHANGED' && 
      n.type !== 'TASK_PRIORITY_CHANGED' && 
      Boolean(n.message && n.message.trim())
    )
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const safeUnreadCount = safeNotifications.filter(n => !checkIsRead(n)).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        (Array.isArray(prev) ? prev : []).map(n => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationApi.markAllAsRead();
      setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const { isAdmin } = useAuth();

  const handleItemClick = async (n: NotificationDTO) => {
    if (!checkIsRead(n)) {
      await handleMarkAsRead(n.id);
    }

    onClose();

    if (onNotificationClick) {
      onNotificationClick(n);
    } else if (n.projectId) {
      const routePrefix = (isAdmin || window.location.pathname.startsWith('/admin')) ? '/admin' : '/member';
      if (n.taskId) {
        navigate(`${routePrefix}/projects/${n.projectId}?taskId=${n.taskId}`);
      } else {
        navigate(`${routePrefix}/projects/${n.projectId}`);
      }
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getTypeIcon = (type: NotificationDTO['type']) => {
    switch (type) {
      case 'PROJECT_INVITE':
        return <UserPlus size={14} className="text-blue-500" />;
      case 'TASK_ASSIGNED':
      case 'REPORTER_ASSIGNED':
        return <CheckSquare size={14} className="text-emerald-500" />;
      case 'USER_MENTIONED':
        return <Tag size={14} className="text-purple-500" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={14} className="text-indigo-500" />;
      case 'TASK_STATUS_CHANGED':
      case 'TASK_PRIORITY_CHANGED':
      case 'TASK_UPDATED':
      default:
        return <AlertCircle size={14} className="text-amber-500" />;
    }
  };

  const getNotificationTitle = (n: NotificationDTO) => {
    if (n.title && n.title.trim()) return n.title;
    return t(`notification_types.${n.type}`, t('notification_types.default'));
  };

  const getNotificationMessage = (n: NotificationDTO) => {
    if (n.message && n.message.trim()) return n.message;
    return 'Có cập nhật mới liên quan đến công việc hoặc dự án của bạn.';
  };

  const filteredNotifications = activeTab === 'unread'
    ? safeNotifications.filter(n => !checkIsRead(n))
    : safeNotifications;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-blue-400" />
          <h3 className="font-bold text-sm tracking-tight text-white">{t('header.notifications')}</h3>
          {safeUnreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
              {safeUnreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {safeUnreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors"
              title={t('header.mark_all_read')}
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">{t('header.mark_all_read')}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('header.all')} ({safeNotifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'unread'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('header.unread')} ({safeUnreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Bell size={32} className="text-slate-300 stroke-1" />
            <p className="text-xs font-medium">{t('header.no_notifications')}</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors relative group ${
                !checkIsRead(n) ? 'bg-blue-50/40' : ''
              }`}
            >
              {/* Actor Avatar with Type Badge */}
              <div className="relative shrink-0 mt-0.5">
                <UserAvatar
                  src={n.actor?.avatarUrl}
                  name={n.actor?.fullName || n.actor?.username || 'Hệ thống'}
                  size="w-9 h-9"
                  textSize="text-xs"
                />
                <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm border border-slate-100">
                  {getTypeIcon(n.type)}
                </div>
              </div>

              {/* Notification Details */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {getNotificationTitle(n)}
                </p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {getNotificationMessage(n)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
                  <Clock size={11} />
                  <span>{formatTime(n.createdAt)}</span>
                </div>
              </div>

              {/* Actions & Unread Indicator */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {!checkIsRead(n) && (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100"
                    title="Chưa đọc"
                  />
                )}
                <button
                  onClick={(e) => handleMarkAsRead(n.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-all"
                  title="Đánh dấu đã đọc"
                >
                  <CheckCheck size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
