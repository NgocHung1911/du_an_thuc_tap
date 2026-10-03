import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import {
  User,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Sparkles,
  Crown,
  HardDrive,
  FolderKanban,
  Users,
  FileType,
  Clock,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  SubscriptionSummaryDTO,
  subscriptionApi,
} from '../../services/subscriptionApi';
import { SubscriptionPlansModal } from '../../components/subscription/SubscriptionPlansModal';
import { BillingHistoryModal } from '../../components/subscription/BillingHistoryModal';

export const PersonalProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionSummaryDTO | null>(null);
  const [loadingSub, setLoadingSub] = useState<boolean>(true);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Current User Details
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await userApi.getCurrentUser();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch Subscription Summary
  const fetchSubscription = async () => {
    try {
      setLoadingSub(true);
      const sub = await subscriptionApi.getMySubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to fetch subscription summary:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
  }, []);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are accepted (JPEG, PNG, WebP, GIF)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds the maximum allowed limit (max 10MB)!');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const updatedUser = await userApi.uploadAvatar(file);
      setProfile(updatedUser);
      setUploadSuccess(t('profile.success_update'));
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload avatar image. Please try again!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'PRO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-full shadow-xs tracking-wide">
            <Sparkles size={13} />
            <span>PRO</span>
          </span>
        );
      case 'ENTERPRISE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black rounded-full shadow-xs tracking-wide">
            <Crown size={13} />
            <span>ENTERPRISE</span>
          </span>
        );
      case 'STARTER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
            <Zap size={13} />
            <span>STARTER</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Page Header */}
      <div className="border-b border-[#DFE1E6] pb-4">
        <h1 className="text-2xl font-bold text-[#172B4D] flex items-center gap-2">
          👤 {t('profile.title', 'Hồ sơ cá nhân')}
        </h1>
        <p className="text-sm text-[#5E6C84] mt-0.5">
          {t('profile.subtitle', 'Quản lý thông tin tài khoản và gói dịch vụ Jira của bạn')}
        </p>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Card: Basic Profile Info */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5 h-fit">
          {/* Avatar Header */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
            <div
              className="relative group cursor-pointer mb-3"
              onClick={handleAvatarClick}
              title={t('profile.change_avatar', 'Đổi ảnh đại diện')}
            >
              <UserAvatar
                src={profile?.avatarUrl}
                name={profile?.fullName || profile?.username || user?.username}
                size="w-24 h-24"
                className="border-4 border-white ring-2 ring-blue-500/20 shadow-md"
                textSize="text-3xl"
              />

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-3xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1">{t('profile.change_avatar', 'Đổi ảnh')}</span>
                  </>
                )}
              </div>

              {uploading && (
                <div className="absolute inset-0 rounded-full bg-slate-900/60 flex items-center justify-center text-white">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              {profile?.fullName || profile?.username || user?.username}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile?.email || user?.email}
            </p>
            <div className="mt-2.5">
              {getPlanBadge(subscription?.plan)}
            </div>
          </div>

          {/* Basic Profile Info Details */}
          <div className="space-y-3 text-xs text-slate-800">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <User size={15} /> {t('users.username', 'Tên đăng nhập')}
              </span>
              <span className="font-semibold text-slate-900">{profile?.username || user?.username}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <Mail size={15} /> {t('users.email', 'Email')}
              </span>
              <span className="font-semibold text-slate-900 truncate max-w-[180px]" title={profile?.email || user?.email}>
                {profile?.email || user?.email || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <User size={15} /> {t('users.full_name', 'Họ và tên')}
              </span>
              <span className="font-semibold text-slate-900">
                {profile?.fullName || (user?.email ? user.email.split('@')[0] : 'N/A')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Subscription & Quota Usage */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                {t('subscription.profile_card_title', 'Gói dịch vụ & Hạn mức sử dụng')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('subscription.profile_card_subtitle', 'Theo dõi dung lượng, số lượng dự án và thành viên của tài khoản')}
              </p>
            </div>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title={t('subscription.billing_history', 'Lịch sử giao dịch')}
            >
              <Receipt size={18} />
            </button>
          </div>

          {loadingSub ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs">{t('common.loading', 'Đang tải thông tin gói...')}</span>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Plan Overview Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100/80 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {t('subscription.current_plan', 'Gói hiện tại')}
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    {subscription?.plan}
                  </div>
                  {subscription?.planExpiresAt && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                      <Clock size={12} className="text-slate-500" />
                      <span>
                        {t('subscription.expires_on', 'Hết hạn ngày:')}{' '}
                        {new Date(subscription.planExpiresAt).toLocaleDateString('vi-VN')}
                        {subscription.daysRemaining !== null && (
                          <span className="text-blue-700 font-bold ml-1">
                            ({subscription.daysRemaining} {t('subscription.days_left', 'ngày còn lại')})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsPlansModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{subscription?.plan === 'STARTER' ? t('subscription.upgrade', 'Nâng cấp ngay') : t('subscription.extend', 'Gia hạn / Nâng gói')}</span>
                  <ArrowUpRight size={15} />
                </button>
              </div>

              {/* Quota Progress Bars */}
              <div className="space-y-4 text-xs">
                {/* 1. Projects Quota */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <FolderKanban size={14} className="text-slate-400" />
                      {t('subscription.projects_owned', 'Dự án sở hữu')}
                    </span>
                    <span className="text-slate-900">
                      {subscription?.currentProjects} / {subscription?.maxProjects === 2147483647 ? '∞' : subscription?.maxProjects}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          subscription?.maxProjects === 2147483647
                            ? 5
                            : Math.min(100, ((subscription?.currentProjects || 0) / (subscription?.maxProjects || 1)) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 2. Unique Members Quota */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {t('subscription.unique_members', 'Thành viên duy nhất (toàn bộ dự án)')}
                    </span>
                    <span className="text-slate-900">
                      {subscription?.currentUniqueMembers} / {subscription?.maxUniqueMembers === 2147483647 ? '∞' : subscription?.maxUniqueMembers}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          subscription?.maxUniqueMembers === 2147483647
                            ? 5
                            : Math.min(100, ((subscription?.currentUniqueMembers || 0) / (subscription?.maxUniqueMembers || 1)) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3. Storage Quota */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <HardDrive size={14} className="text-slate-400" />
                      {t('subscription.cloud_storage', 'Dung lượng lưu trữ đám mây')}
                    </span>
                    <span className="text-slate-900">
                      {formatBytes(subscription?.usedStorageBytes || 0)} / {formatBytes(subscription?.maxStorageBytes || 0)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((subscription?.usedStorageBytes || 0) / (subscription?.maxStorageBytes || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4. File Specs Info */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 flex items-center gap-1 mb-0.5">
                      <FileType size={13} className="text-slate-400" />
                      {t('subscription.allowed_types', 'Định dạng file')}
                    </div>
                    <div>{subscription?.allowedFileTypes?.join(', ')}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 flex items-center gap-1 mb-0.5">
                      <HardDrive size={13} className="text-slate-400" />
                      {t('subscription.max_file_size', 'Kích thước file tối đa')}
                    </div>
                    <div>{formatBytes(subscription?.maxFileSizeBytes || 0)}/file</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        currentSummary={subscription}
        onSubscriptionUpdated={() => {
          fetchSubscription();
          fetchProfile();
        }}
      />

      {/* Billing History Modal */}
      <BillingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};
