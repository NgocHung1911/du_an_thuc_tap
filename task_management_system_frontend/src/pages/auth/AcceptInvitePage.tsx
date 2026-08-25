import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, RefreshCw, Mail, UserPlus, LogIn, ShieldAlert } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { invitationApi, InvitationVerifyResponse } from '../../services/invitationApi';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || localStorage.getItem('pendingInviteToken') || '';

  const { isAuthenticated, login, roles } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [verifyData, setVerifyData] = useState<InvitationVerifyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const hasAcceptedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Không tìm thấy mã xác nhận lời mời trong liên kết.');
      setLoading(false);
      return;
    }

    const processInvitation = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        console.log(">>> [ACCEPT INVITE PAGE] 1. Verifying token:", token);

        // BƯỚC 1: Gọi API Verify Token từ Backend
        const data = await invitationApi.verifyInvitationToken(token);
        console.log(">>> [ACCEPT INVITE PAGE] 2. Verify Response:", data);
        setVerifyData(data);

        // Kiểm tra xem user có token đăng nhập ở LocalStorage hay state không
        const tokenInStorage = localStorage.getItem('token');
        const userIsLoggedIn = isAuthenticated || Boolean(tokenInStorage);

        // 🟢 KỊCH BẢN 1A: Token hợp lệ (PENDING/VALID) & Người dùng ĐÃ ĐĂNG NHẬP -> Tự động gọi API accept
        if (data.isValid && !data.isAccepted && userIsLoggedIn && !hasAcceptedRef.current) {
          hasAcceptedRef.current = true;
          setAccepting(true);
          console.log(">>> [ACCEPT INVITE PAGE] 3. Calling API acceptInvitation for token:", token);

          try {
            const acceptRes = await invitationApi.acceptInvitation(token);
            console.log(">>> [ACCEPT INVITE PAGE] 4. Accept Invitation Success:", acceptRes);
            localStorage.removeItem('pendingInviteToken');

            const targetProjectId = acceptRes.projectId || data.projectId;
            const projectName = acceptRes.projectName || data.projectName;
            const successText = `Tham gia dự án "${projectName}" thành công!`;
            setSuccessMessage(`${successText} Đang chuyển hướng vào dự án...`);
            showToast(successText, 'success');

            // Chuyển hướng trực tiếp tới trang chi tiết dự án (Kanban Board)
            setTimeout(() => {
              const isAdminUser = roles?.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
              const targetPath = isAdminUser ? `/admin/projects/${targetProjectId}` : `/member/projects/${targetProjectId}`;
              console.log(">>> [ACCEPT INVITE PAGE] 5. Navigating to project board:", targetPath);
              navigate(targetPath, { replace: true });
            }, 1200);
          } catch (acceptErr: any) {
            console.error('>>> [ACCEPT INVITE PAGE] Lỗi khi tự động chấp nhận lời mời:', acceptErr.response?.status, acceptErr.response?.data);
            const msg = acceptErr.response?.data?.message || 'Không thể chấp nhận lời mời. Vui lòng thử lại!';
            setErrorMessage(msg);
            showToast(msg, 'error');
          } finally {
            setAccepting(false);
          }
        }
        // 🟢 KỊCH BẢN 1B: Lời mời ĐÃ ACCEPTED trước đó & Người dùng ĐÃ ĐĂNG NHẬP -> Chuyển thẳng tới Bảng Kanban
        else if (data.isAccepted && userIsLoggedIn) {
          setSuccessMessage(`Bạn đã là thành viên của dự án "${data.projectName}". Đang chuyển hướng...`);
          showToast(`Bạn đã là thành viên của dự án "${data.projectName}"`, 'success');
          setTimeout(() => {
            const isAdminUser = roles?.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
            const targetPath = isAdminUser ? `/admin/projects/${data.projectId}` : `/member/projects/${data.projectId}`;
            console.log(">>> [ACCEPT INVITE PAGE] Already member, navigating to:", targetPath);
            navigate(targetPath, { replace: true });
          }, 1000);
        }
      } catch (err: any) {
        console.error('>>> [ACCEPT INVITE PAGE] Lỗi verify token lời mời:', err.response?.status, err.response?.data || err.message);
        const msg = err.response?.data?.message || 'Mã lời mời không tồn tại hoặc đã hết hạn trong vòng 48 giờ.';
        setErrorMessage(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    processInvitation();
  }, [token, isAuthenticated, roles, navigate]);

  // Xử lý nút Chấp nhận lời mời thủ công nếu cần
  const handleAcceptInviteManual = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await invitationApi.acceptInvitation(token);
      localStorage.removeItem('pendingInviteToken');
      const targetProjectId = res.projectId || verifyData?.projectId;
      const projectName = res.projectName || verifyData?.projectName;
      showToast(`Tham gia dự án "${projectName}" thành công!`, 'success');
      const isAdminUser = roles?.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
      const targetPath = isAdminUser ? `/admin/projects/${targetProjectId}` : `/member/projects/${targetProjectId}`;
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      console.error('Lỗi khi chấp nhận lời mời:', err);
      const msg = err.response?.data?.message || 'Không thể chấp nhận lời mời!';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setAccepting(false);
    }
  };

  // Google Auth callback cho tài khoản mới
  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setAccepting(true);
      const authData = await authApi.googleLogin(tokenResponse.access_token);
      login(authData.token, { username: authData.username, email: authData.email, roles: authData.roles });

      if (token) {
        const acceptRes = await invitationApi.acceptInvitation(token);
        localStorage.removeItem('pendingInviteToken');
        showToast(`Tham gia dự án "${acceptRes.projectName}" thành công!`, 'success');
        const isAdminUser = authData.roles?.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
        const targetPath = isAdminUser ? `/admin/projects/${acceptRes.projectId}` : `/member/projects/${acceptRes.projectId}`;
        navigate(targetPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('Lỗi Google Auth:', err);
      setErrorMessage('Đăng nhập Google thất bại. Vui lòng thử lại.');
      showToast('Đăng nhập Google thất bại.', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setErrorMessage('Đăng nhập bằng Google thất bại.'),
  });

  const handleNavigateToLogin = () => {
    if (token) localStorage.setItem('pendingInviteToken', token);
    const emailParam = verifyData?.email ? `&email=${encodeURIComponent(verifyData.email)}` : '';
    navigate(`/login?token=${token}${emailParam}`);
  };

  const handleNavigateToRegister = () => {
    if (token) localStorage.setItem('pendingInviteToken', token);
    const emailParam = verifyData?.email ? `&email=${encodeURIComponent(verifyData.email)}` : '';
    navigate(`/register?token=${token}${emailParam}`);
  };

  const userIsLoggedIn = isAuthenticated || Boolean(localStorage.getItem('token'));

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="p-6 bg-[#0052CC] text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Task Management System</h1>
          <p className="text-xs text-blue-100 mt-1">Xác nhận lời mời tham gia dự án</p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {loading || accepting ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="animate-spin text-[#0052CC] mx-auto" size={32} />
              <p className="text-xs font-semibold text-[#5E6C84]">
                {successMessage || 'Đang xử lý tham gia dự án...'}
              </p>
            </div>
          ) : errorMessage || !verifyData || !verifyData.isValid ? (
            /* TRƯỜNG HỢP LỖI HOẶC TOKEN HẾT HẠN */
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#172B4D]">Liên Kết Lời Mời Không Hợp Lệ</h2>
                <p className="text-xs text-[#5E6C84] mt-1.5 leading-relaxed">
                  {errorMessage ||
                    (verifyData?.isExpired
                      ? 'Liên kết mời này đã hết hạn trong vòng 48 giờ. Vui lòng liên hệ Admin để gửi lại lời mời mới.'
                      : 'Liên kết không tồn tại hoặc đã được sử dụng.')}
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Quay về trang Đăng nhập
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Project Summary Box */}
              <div className="p-4 bg-[#DEEBFF]/40 border border-[#B3D4FF] rounded-xl text-center">
                <span className="text-[11px] font-bold text-[#0052CC] bg-white px-2.5 py-0.5 rounded-full border border-[#B3D4FF] uppercase tracking-wider">
                  Dự án được mời
                </span>
                <h2 className="text-xl font-extrabold text-[#172B4D] mt-2 tracking-tight">
                  {verifyData.projectName}
                </h2>
                {verifyData.projectDescription && (
                  <p className="text-xs text-[#5E6C84] mt-1 line-clamp-2">
                    {verifyData.projectDescription}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-[#B3D4FF]/60 flex items-center justify-center gap-1.5 text-xs font-medium text-[#0747A6]">
                  <Mail size={14} />
                  <span>Dành cho: <strong>{verifyData.email}</strong></span>
                </div>
              </div>

              {/* Success Banner if auto accepted */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* 🟢 KỊCH BẢN 1: ĐÃ CÓ TÀI KHOẢN & ĐANG ĐĂNG NHẬP */}
              {userIsLoggedIn ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Bạn đã đăng nhập hệ thống. Bấm nút bên dưới để tham gia dự án ngay!</span>
                  </div>

                  <button
                    onClick={handleAcceptInviteManual}
                    disabled={accepting}
                    className="w-full py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
                  >
                    {accepting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    <span>Chấp Nhận Lời Mời &amp; Vào Dự Án Ngay</span>
                  </button>
                </div>
              ) : verifyData.isRegistered ? (
                /* 🟡 KỊCH BẢN 2: ĐÃ CÓ TÀI KHOẢN NHƯNG CHƯA ĐĂNG NHẬP */
                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#0747A6] font-medium text-center">
                    Tài khoản <strong>{verifyData.email}</strong> đã có trên hệ thống. Vui lòng đăng nhập để nhận lời mời.
                  </div>

                  <button
                    onClick={handleNavigateToLogin}
                    className="w-full py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <LogIn size={16} />
                    <span>Đăng Nhập Để Nhận Lời Mời</span>
                  </button>
                </div>
              ) : (
                /* 🔴 KỊCH BẢN 3: CHƯA CÓ TÀI KHOẢN TRONG HỆ THỐNG */
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-amber-800">
                      <ShieldAlert size={16} />
                      <span>Bạn chưa có tài khoản trong hệ thống</span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Vui lòng tạo tài khoản mới hoặc đăng nhập bằng Google để tham gia dự án <strong>{verifyData.projectName}</strong>.
                    </p>
                  </div>

                  <button
                    onClick={handleNavigateToRegister}
                    className="w-full py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <UserPlus size={16} />
                    <span>Tạo Tài Khoản Mới</span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-3 text-gray-400 text-[11px] font-semibold">hoặc</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => googleLogin()}
                    disabled={accepting}
                    className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-300 flex items-center justify-center gap-2 shadow-2xs transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Đăng nhập bằng Google</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-red-600 text-white border-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
