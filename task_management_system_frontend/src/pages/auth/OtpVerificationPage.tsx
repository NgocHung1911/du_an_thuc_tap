import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { ShieldCheck, Mail, AlertCircle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export const OtpVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Focus next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const otpCode = otpDigits.join('');
    if (!email.trim()) {
      setError('Vui lòng nhập Email xác thực!');
      return;
    }
    if (otpCode.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số OTP!');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.verifyOtp({ email, otpCode });
      setSuccess(response.message || 'Xác thực OTP thành công! Đang chuyển hướng về trang Đăng nhập...');
      setTimeout(() => {
        navigate('/login', { state: { emailVerified: true, email } });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Xác thực OTP thất bại. Vui lòng kiểm tra lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resendLoading) return;

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ Email!');
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      const res = await authApi.resendOtp(email);
      setSuccess(res.message || 'Mã OTP mới đã được gửi tới Email của bạn!');
      setCountdown(60);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Gửi lại mã OTP thất bại!');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg border border-[#DFE1E6] shadow-md p-8">
        {/* Jira Style Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#0052CC] rounded-lg flex items-center justify-center text-white mb-3 shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Xác Thực Email OTP</h1>
          <p className="text-sm text-[#5E6C84] mt-1 text-center">
            Mã OTP 6 số đã được gửi tới email của bạn qua Brevo REST API
          </p>
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

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-1.5">
              Địa chỉ Email xác thực
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B778C]">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] text-sm focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/20 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-2 text-center">
              Nhập mã OTP 6 chữ số
            </label>
            <div className="flex justify-between gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center font-bold text-xl text-[#0052CC] bg-[#FAFBFC] border border-[#DFE1E6] rounded-md focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#4C9AFF]/30 focus:outline-none transition-all shadow-xs"
                />
              ))}
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
                <ShieldCheck size={18} />
                <span>Xác nhận mã OTP</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#EBECF0] flex flex-col items-center gap-3">
          <div className="text-sm text-[#5E6C84] flex items-center gap-2">
            <span>Chưa nhận được mã?</span>
            <button
              onClick={handleResendOtp}
              disabled={countdown > 0 || resendLoading}
              className="text-[#0052CC] font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
              {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã OTP'}
            </button>
          </div>

          <Link to="/login" className="text-xs text-[#5E6C84] hover:text-[#172B4D] flex items-center gap-1 mt-1">
            <ArrowLeft size={14} />
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
