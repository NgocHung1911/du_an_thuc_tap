import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { GoogleLogin } from '@react-oauth/google';
import { LogIn, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = (response: any) => {
    login(response.token, {
      username: response.username,
      email: response.email,
      roles: response.roles,
    });

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
    setUnverifiedEmail(null);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      handleLoginSuccess(response);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.isVerified === false) {
        setError(err.response.data.message || 'Tài khoản chưa được xác thực OTP!');
        setUnverifiedEmail(err.response.data.email || '');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
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
    setUnverifiedEmail(null);

    try {
      const response = await authApi.googleLogin(credentialResponse.credential);
      handleLoginSuccess(response);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng nhập Google thất bại!');
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
            <LogIn size={26} />
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Task Management</h1>
          <p className="text-sm text-[#5E6C84] mt-1">Đăng nhập vào không gian làm việc Jira</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] rounded text-sm space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {unverifiedEmail && (
              <div className="pt-2 border-t border-[#FFBDAD]/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/verify-otp', { state: { email: unverifiedEmail } })}
                  className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <ShieldCheck size={14} />
                  <span>Xác thực OTP ngay</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Google Sign-In Section */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Đăng nhập bằng Google không thành công!')}
              shape="rectangular"
              theme="outline"
              size="large"
              width="336px"
              text="signin_with"
            />
          </div>

          <div className="w-full flex items-center gap-3 my-5">
            <div className="h-px bg-[#DFE1E6] flex-1"></div>
            <span className="text-xs font-semibold text-[#6B778C] uppercase">hoặc</span>
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
                placeholder="Nhập username"
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
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#172B4D] text-white font-medium py-2.5 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>Đăng nhập</span>
                <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#EBECF0] text-center text-sm text-[#5E6C84]">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-[#0052CC] font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
