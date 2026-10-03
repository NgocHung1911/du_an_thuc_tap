import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Copy,
  Check,
  Clock,
  QrCode,
  Building2,
  CreditCard,
  User,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PaymentOrderResponseDTO, subscriptionApi } from '../../services/subscriptionApi';

interface PaymentModalProps {
  order: PaymentOrderResponseDTO;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [currentOrder, setCurrentOrder] = useState<PaymentOrderResponseDTO>(order);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(order.remainingSeconds || 900);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(order.status === 'SUCCESS');
  const [isExpired, setIsExpired] = useState<boolean>(order.status === 'EXPIRED');

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Countdown timer
  useEffect(() => {
    if (isSuccess || isExpired) return;

    timerIntervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [isSuccess, isExpired]);

  // Polling order status every 3 seconds
  useEffect(() => {
    if (isSuccess || isExpired) return;

    const checkStatus = async () => {
      try {
        const updated = await subscriptionApi.getOrderDetails(currentOrder.orderCode);
        setCurrentOrder(updated);

        if (updated.status === 'SUCCESS') {
          setIsSuccess(true);
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          setTimeout(() => {
            onSuccess();
          }, 3000);
        } else if (updated.status === 'EXPIRED') {
          setIsExpired(true);
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
        }
      } catch (err) {
        console.error('Failed to poll order status:', err);
      }
    };

    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => clearInterval(pollIntervalRef.current);
  }, [currentOrder.orderCode, isSuccess, isExpired, onSuccess]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const manualCheck = async () => {
    setIsChecking(true);
    try {
      const updated = await subscriptionApi.getOrderDetails(currentOrder.orderCode);
      setCurrentOrder(updated);
      if (updated.status === 'SUCCESS') {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <QrCode size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {t('subscription.payment_title', 'Thanh toán nâng cấp gói')} {currentOrder.targetPlan}
              </h2>
              <p className="text-xs text-blue-100">
                {t('subscription.payment_subtitle', 'Quét mã VietQR hoặc chuyển khoản theo thông tin dưới đây')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Overlay */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
                <Sparkles className="text-amber-500" size={22} />
                {t('subscription.payment_success_title', 'Thanh toán thành công!')}
              </h3>
              <p className="text-sm text-slate-600">
                {t('subscription.payment_success_desc', 'Tài khoản của bạn đã được nâng cấp lên gói')} <span className="font-bold text-blue-600">{currentOrder.targetPlan}</span>.
              </p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium max-w-md mx-auto">
              {t('subscription.payment_auto_applied', 'Tất cả các tính năng và dung lượng đã được mở rộng cho 30 ngày tiếp theo.')}
            </div>
          </div>
        ) : isExpired ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {t('subscription.payment_expired_title', 'Đơn hàng đã hết hạn')}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {t('subscription.payment_expired_desc', 'Thời gian chờ thanh toán (15 phút) đã kết thúc. Vui lòng đóng và tạo đơn mới.')}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: QR Code & Timer */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              {/* Countdown badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold mb-3 shadow-2xs">
                <Clock size={14} className="animate-pulse" />
                <span>{t('subscription.time_remaining', 'Hết hạn sau:')} {formatTime(remainingTime)}</span>
              </div>

              {/* QR Image */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm relative group">
                <img
                  src={currentOrder.qrCodeUrl}
                  alt="VietQR Payment Code"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              </div>

              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {t('subscription.qr_instruction', 'Mở ứng dụng Ngân hàng / ví điện tử để quét mã')}
              </p>

              {/* Manual Refresh Button */}
              <button
                onClick={manualCheck}
                disabled={isChecking}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isChecking ? 'animate-spin text-blue-600' : ''} />
                <span>{isChecking ? t('subscription.checking', 'Đang kiểm tra...') : t('subscription.check_payment', 'Kiểm tra thanh toán')}</span>
              </button>
            </div>

            {/* Right Column: Bank Transfer Details */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {/* Bank */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 size={16} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t('subscription.bank', 'Ngân hàng')}</div>
                      <div className="text-xs font-bold text-slate-800">{currentOrder.bankId}</div>
                    </div>
                  </div>
                </div>

                {/* Account Number */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard size={16} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t('subscription.account_number', 'Số tài khoản')}</div>
                      <div className="text-xs font-bold text-slate-900 font-mono tracking-wide">{currentOrder.accountNumber}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(currentOrder.accountNumber, 'accNo')}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                    title="Copy"
                  >
                    {copiedField === 'accNo' ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Account Holder */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <User size={16} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t('subscription.account_name', 'Chủ tài khoản')}</div>
                      <div className="text-xs font-bold text-slate-800 uppercase">{currentOrder.accountName}</div>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DollarSign size={16} className="text-blue-600" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-blue-500">{t('subscription.amount', 'Số tiền chính xác')}</div>
                      <div className="text-sm font-extrabold text-blue-700">
                        {currentOrder.amountVnd.toLocaleString('vi-VN')} đ
                        <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                          (~${currentOrder.amountUsd})
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(currentOrder.amountVnd.toString(), 'amount')}
                    className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                    title="Copy"
                  >
                    {copiedField === 'amount' ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Transfer Content / Order Code */}
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-amber-600" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-600">{t('subscription.transfer_content', 'Nội dung chuyển khoản (Bắt buộc)')}</div>
                      <div className="text-xs font-extrabold text-amber-900 font-mono tracking-wider">{currentOrder.transferContent}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(currentOrder.transferContent, 'content')}
                    className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition cursor-pointer"
                    title="Copy"
                  >
                    {copiedField === 'content' ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                <AlertCircle size={15} className="text-slate-500 shrink-0 mt-0.5" />
                <span>
                  {t('subscription.exact_content_warning', 'Vui lòng điền CHÍNH XÁC nội dung chuyển khoản để hệ thống tự động kích hoạt gói trong 5-10 giây.')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
