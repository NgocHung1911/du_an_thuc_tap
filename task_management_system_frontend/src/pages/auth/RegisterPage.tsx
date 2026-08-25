import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus, Mail, Lock, User, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const inviteEmail = searchParams.get('email');
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [searchParams]);

  const handleLoginSuccess = async (response: any) => {
    login(response.token, {
      username: response.username,
      email: response.email,
      roles: response.roles,
    });

    const pendingToken = searchParams.get('token') || localStorage.getItem('pendingInviteToken');
    if (pendingToken) {
      console.log(">>> [REGISTER PAGE] Found pendingInviteToken, navigating to /accept-invite page:", pendingToken);
      navigate(`/accept-invite?token=${pendingToken}`, { replace: true });
      return;
    }

    const isAdmin = response.roles.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/member/my-tasks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tất cả các trường!');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        username,
        email,
        password,
        role,
      });

      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng đến trang nhập mã OTP xác thực...');
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError('Không thể lấy Token xác thực từ Google!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.googleLogin(credentialResponse.credential);
      handleLoginSuccess(response);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng ký / Đăng nhập Google thất bại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg border border-[#DFE1E6] shadow-md p-8">
        {/* Jira Style Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#0052CC] rounded-lg flex items-center justify-center text-white mb-3 shadow-sm">
            <UserPlus size={26} />
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Tạo Tài Khoản Mới</h1>
          <p className="text-sm text-[#5E6C84] mt-1">Tham gia hệ thống quản lý công việc Jira</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] rounded text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] rounded text-sm flex items-start gap-2.5">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Google Sign-Up / Login Button */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Đăng nhập bằng Google không thành công!')}
              shape="rectangular"
              theme="outline"
              size="large"
              width="336px"
              text="signup_with"
            />
          </div>

          <div className="w-full flex items-center gap-3 my-5">
            <div className="h-px bg-[#DFE1E6] flex-1"></div>
            <span className="text-xs font-semibold text-[#6B778C] uppercase">hoặc nhập thông tin</span>
            <div className="h-px bg-[#DFE1E6] flex-1"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
              Tên đăng nhập
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhanvien@domain.com"
                className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
              Vai trò (Role)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                <ShieldCheck size={18} />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'MEMBER' | 'ADMIN')}
                className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
              >
                <option value="MEMBER">Member (Thành viên / Nhân viên)</option>
                <option value="ADMIN">Admin (Quản trị viên)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#172B4D] text-white font-medium py-2.5 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-sm mt-6 disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>Đăng ký Tài Khoản</span>
                <UserPlus size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#EBECF0] text-center text-sm text-[#5E6C84]">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#0052CC] font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
