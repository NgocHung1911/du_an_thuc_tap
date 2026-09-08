import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import { User, Mail, Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const PersonalProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ chấp nhận các file ảnh (JPEG, PNG, WebP, GIF)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB)!');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const updatedUser = await userApi.uploadAvatar(file);
      setProfile(updatedUser);
      setUploadSuccess('Đã cập nhật ảnh đại diện lên Cloudflare R2 thành công!');
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setUploadError(err.response?.data?.message || 'Không thể tải ảnh lên Cloudflare R2. Vui lòng thử lại!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl pb-12 font-sans">
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
          👤 Personal Profile
        </h1>
        <p className="text-sm text-[#5E6C84] mt-0.5">
          View and manage your personal account profile & avatar
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

      {/* Main Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        {/* Avatar Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
          <div className="relative group cursor-pointer mb-3" onClick={handleAvatarClick} title="Bấm để thay đổi ảnh đại diện">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md overflow-hidden border-4 border-white ring-2 ring-blue-500/20">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback on image load error
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{getInitials(profile?.fullName || profile?.username || user?.username)}</span>
              )}
            </div>

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-3xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <Camera size={20} />
                  <span className="text-[10px] font-bold mt-1">Đổi ảnh</span>
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
        </div>

        {/* Basic Profile Info Details */}
        <div className="space-y-4 text-xs text-slate-800">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <User size={16} /> Username
            </span>
            <span className="font-semibold text-slate-900">{profile?.username || user?.username}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <Mail size={16} /> Email Address
            </span>
            <span className="font-semibold text-slate-900">{profile?.email || user?.email || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <User size={16} /> Full Name
            </span>
            <span className="font-semibold text-slate-900">
              {profile?.fullName || (user?.email ? user.email.split('@')[0] : 'N/A')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
