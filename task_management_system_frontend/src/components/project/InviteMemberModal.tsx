import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, Check, Mail, Send } from 'lucide-react';
import { invitationApi } from '../../services/invitationApi';
import { UserDTO } from '../../services/taskApi';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  existingMemberIds?: number[];
  onMemberInvited?: (newMember: UserDTO) => void;
  onShowSuccessToast?: (msg: string) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onMemberInvited,
  onShowSuccessToast,
}) => {
  const [emailInput, setEmailInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmailInput('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientEmail = emailInput.trim();
    if (!recipientEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email người cần mời.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await invitationApi.sendInvitation(projectId, recipientEmail);
      const msg = res.message || `Đã gửi email mời thành công đến ${recipientEmail}!`;
      setSuccessMessage(msg);
      if (onShowSuccessToast) {
        onShowSuccessToast(msg);
      }
      setTimeout(() => {
        setEmailInput('');
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Lỗi khi gửi email lời mời:', err);
      const rawData = err.response?.data;
      const backendMessage =
        (typeof rawData === 'string' ? rawData : null) ||
        rawData?.message ||
        rawData?.error ||
        err.message ||
        'Không thể gửi lời mời người dùng. Vui lòng kiểm tra lại địa chỉ email.';
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F4F5F7] border-b border-[#DFE1E6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#172B4D]">Gửi Lời Mời Tham Gia Dự Án</h3>
              <p className="text-xs text-[#5E6C84]">Gửi liên kết lời mời qua email cho thành viên mới</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150 font-bold">
              <Check size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email Input Field */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
              Địa chỉ Email người được mời <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#5E6C84] pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Nhập địa chỉ email người cần mời (ví dụ: member@gmail.com)..."
                className={`w-full pl-9 pr-4 py-2.5 bg-[#F4F5F7] focus:bg-white text-sm text-[#172B4D] rounded-xl border transition-all ${
                  errorMessage
                    ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                    : 'border-[#DFE1E6] focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]'
                } outline-none`}
                disabled={loading || !!successMessage}
                autoFocus
              />
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Business Rules Info Box */}
          <div className="p-3.5 bg-[#DEEBFF]/40 rounded-xl border border-[#B3D4FF] text-xs text-[#0747A6] space-y-1">
            <p className="font-bold">Quy trình mời thành viên:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>Hệ thống sẽ tạo <strong>Mã Token duy nhất</strong> có thời hạn trong <strong>48 giờ</strong>.</li>
              <li>Tự động gửi email chứa nút bấm <strong>"Chấp nhận lời mời"</strong> đến người nhận.</li>
              <li>Người nhận chỉ cần nhấp vào link trong email để tham gia ngay vào dự án.</li>
            </ul>
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-[#DFE1E6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-[#F4F5F7] hover:bg-[#EBECF0] text-[#172B4D] text-xs font-semibold rounded-xl border border-[#DFE1E6] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !!successMessage}
              className="px-5 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <Send size={15} />
              )}
              <span>Gửi Lời Mời Qua Email</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
