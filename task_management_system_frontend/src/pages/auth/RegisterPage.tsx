import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { PublicFooter } from '../../components/layout/PublicFooter';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const role = 'MEMBER';
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
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans flex flex-col justify-between pt-20">
      {/* ========== HEADER ========== */}
      <PublicHeader transparentOnTop={false} />

      {/* ========== MAIN FORM CARD ========== */}
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#DFE1E6] shadow-xl p-8">
          {/* Jira Style Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#0052CC] rounded-xl flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20">
              <UserPlus size={26} />
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Create TaskFlow Account</h1>
            <p className="text-sm text-[#5E6C84] mt-1">Get started with your project workspace</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] rounded-xl text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] rounded-xl text-sm flex items-start gap-2.5">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@domain.com"
                  className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 chars)"
                  className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl text-[#172B4D] placeholder-[#a5adba] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#172B4D] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm mt-6 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-Up Section */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="w-full flex items-center gap-3 mb-5">
              <div className="h-px bg-[#DFE1E6] flex-1"></div>
              <span className="text-xs font-semibold text-[#6B778C] uppercase">or sign up with</span>
              <div className="h-px bg-[#DFE1E6] flex-1"></div>
            </div>

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
          </div>

          <div className="mt-6 pt-6 border-t border-[#EBECF0] text-center text-sm text-[#5E6C84]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0052CC] font-semibold hover:underline">
              Sign in now
            </Link>
          </div>
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <PublicFooter />
    </div>
  );
};

