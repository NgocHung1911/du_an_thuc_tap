import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { UserDTO } from '../../services/taskApi';
import { UserRequest } from '../../services/userApi';

interface UserFormModalProps {
  isOpen: boolean;
  userToEdit?: UserDTO | null;
  onClose: () => void;
  onSubmit: (data: UserRequest, userId?: number) => Promise<void>;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  userToEdit,
  onClose,
  onSubmit,
}) => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email || '');
      setFullName(userToEdit.fullName || '');
      setPassword('');
      setRole((userToEdit.role as 'ADMIN' | 'MEMBER') || 'MEMBER');
    } else {
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      setRole('MEMBER');
    }
    setError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username không được để trống.');
      return;
    }
    if (!email.trim()) {
      setError('Email không được để trống.');
      return;
    }
    if (!userToEdit && !password.trim()) {
      setError('Mật khẩu không được để trống khi tạo mới người dùng.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: UserRequest = {
        username: username.trim(),
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        role,
      };

      if (!userToEdit && password.trim()) {
        payload.password = password.trim();
      }

      await onSubmit(payload, userToEdit?.id);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lưu người dùng:', err);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể lưu người dùng.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {userToEdit ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
              </h2>
              <p className="text-xs text-slate-500">
                {userToEdit ? `Cập nhật thông tin tài khoản #${userToEdit.id}` : 'Nhập thông tin để tạo tài khoản mới trong hệ thống'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tên đăng nhập (Username) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User size={15} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: john_doe"
                disabled={Boolean(userToEdit)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Họ và Tên (Full Name)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User size={15} />
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="vd: Nguyễn Văn A"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Mail size={15} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: user@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password (Chỉ hiển thị khi tạo mới người dùng) */}
          {!userToEdit && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Role */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Vai trò (Role) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Shield size={15} />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all font-semibold cursor-pointer"
              >
                <option value="MEMBER">MEMBER (Thành viên)</option>
                <option value="ADMIN">ADMIN (Quản trị viên)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>{userToEdit ? 'Lưu Thay Đổi' : 'Tạo Người Dùng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
