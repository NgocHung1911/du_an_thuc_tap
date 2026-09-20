import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { GoogleLogin } from '@react-oauth/google';
import { LogIn, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setUsername(emailParam);
    }
  }, [searchParams]);

  const handleLoginSuccess = async (response: any) => {
    login(response.token, {
      username: response.username,
      email: response.email,
      roles: response.roles,
    });

    const pendingToken = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('pendingInviteToken');
    if (pendingToken) {
      console.log(">>> [LOGIN PAGE] Found pendingInviteToken, navigating to /accept-invite page:", pendingToken);
      navigate(`/accept-invite?token=${pendingToken}`, { replace: true });
      return;
    }

    const isAdmin = response.roles.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/member/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập cả Tên đăng nhập và Mật khẩu!');
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
      setError('Không thể lấy mã xác thực từ Google!');
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
        setError('Đăng nhập bằng Google thất bại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans flex flex-col justify-between pt-20">
      {/* ========== HEADER ========== */}
      <PublicHeader transparentOnTop={false} />

      {/* ========== MAIN FORM CARD ========== */}
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#DFE1E6] shadow-xl p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#0052CC] rounded-xl flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20">
              <LogIn size={26} />
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">{t('auth.login_title')}</h1>
            <p className="text-sm text-[#5E6C84] mt-1">{t('auth.login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] rounded-xl text-sm space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {unverifiedEmail && (
                <div className="pt-2 border-t border-[#FFBDAD]/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/verify-otp', { state: { email: unverifiedEmail } })}
                    className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>{t('auth.verify_btn')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
                {t('auth.username_or_email')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username_placeholder')}
                  className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#172B4D] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 mt-6 cursor-pointer"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <span>{t('auth.login_btn')}</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-In Section */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="w-full flex items-center gap-3 mb-5">
              <div className="h-px bg-[#DFE1E6] flex-1"></div>
              <span className="text-xs font-semibold text-[#6B778C] uppercase">Hoặc</span>
              <div className="h-px bg-[#DFE1E6] flex-1"></div>
            </div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign in was unsuccessful!')}
                shape="rectangular"
                theme="outline"
                size="large"
                width="336px"
                text="signin_with"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#EBECF0] text-center text-sm text-[#5E6C84]">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-[#0052CC] font-semibold hover:underline">
              {t('auth.register_now')}
            </Link>
          </div>
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-stone-200/80 py-8 px-6 lg:px-8 bg-white">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-[#0052CC] flex items-center justify-center text-white font-bold text-[10px]">
              K
            </div>
            <span className="font-bold text-stone-900 text-sm">Kira Task Management</span>
          </div>

          <p>© {new Date().getFullYear()} Kira Task Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};


