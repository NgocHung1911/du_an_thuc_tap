import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import { User, Mail } from 'lucide-react';

export const MemberProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

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

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      {/* Page Header */}
      <div className="border-b border-[#DFE1E6] pb-4">
        <h1 className="text-2xl font-bold text-[#172B4D] flex items-center gap-2">
          👤 Personal Profile
        </h1>
        <p className="text-sm text-[#5E6C84] mt-0.5">
          View your basic account information
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-xs space-y-6">
        {/* Avatar Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-[#EBECF0]">
          <div className="w-20 h-20 rounded-full bg-[#0052CC] text-white font-bold text-2xl flex items-center justify-center shadow-md mb-3">
            {getInitials(profile?.fullName || profile?.username || user?.username)}
          </div>
          <h2 className="text-lg font-bold text-[#172B4D]">
            {profile?.fullName || profile?.username || user?.username}
          </h2>
          <p className="text-xs text-[#5E6C84] mt-0.5">
            {profile?.email || user?.email}
          </p>
        </div>

        {/* Basic Profile Info Details */}
        <div className="space-y-4 text-xs text-[#172B4D]">
          <div className="flex items-center justify-between py-2 border-b border-[#EBECF0]">
            <span className="text-[#5E6C84] flex items-center gap-2 font-medium">
              <User size={16} /> Username
            </span>
            <span className="font-semibold text-[#172B4D]">{profile?.username || user?.username}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#EBECF0]">
            <span className="text-[#5E6C84] flex items-center gap-2 font-medium">
              <Mail size={16} /> Email Address
            </span>
            <span className="font-semibold text-[#172B4D]">{profile?.email || user?.email || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-[#5E6C84] flex items-center gap-2 font-medium">
              <User size={16} /> Full Name
            </span>
            <span className="font-semibold text-[#172B4D]">
              {profile?.fullName || (user?.email ? user.email.split('@')[0] : 'N/A')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
