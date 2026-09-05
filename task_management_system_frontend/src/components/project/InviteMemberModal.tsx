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
      setErrorMessage('Please enter the recipient email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await invitationApi.sendInvitation(projectId, recipientEmail);
      const msg = res.message || `Invitation email sent successfully to ${recipientEmail}!`;
      setSuccessMessage(msg);
      if (onShowSuccessToast) {
        onShowSuccessToast(msg);
      }
      setTimeout(() => {
        setEmailInput('');
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error sending invitation email:', err);
      const rawData = err.response?.data;
      const backendMessage =
        (typeof rawData === 'string' ? rawData : null) ||
        rawData?.message ||
        rawData?.error ||
        err.message ||
        'Could not send invitation. Please check the email address.';
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Invite Project Member</h3>
              <p className="text-xs text-slate-500">Send an invitation email link to a new team member</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            title="Close modal"
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Recipient Email Address <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter email address (e.g. member@example.com)..."
                className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border transition-all ${
                  errorMessage
                    ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
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
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-800 space-y-1">
            <p className="font-bold">Member invitation process:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-700">
              <li>A <strong>unique invitation token</strong> valid for <strong>48 hours</strong> will be generated.</li>
              <li>An automated email with an <strong>"Accept Invitation"</strong> link will be delivered.</li>
              <li>The recipient can click the link to instantly join this project.</li>
            </ul>
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!successMessage}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <Send size={15} />
              )}
              <span>Send Email Invitation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


