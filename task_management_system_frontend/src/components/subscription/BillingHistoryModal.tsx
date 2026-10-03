import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Receipt, Loader2, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { PaymentOrderResponseDTO, subscriptionApi } from '../../services/subscriptionApi';

interface BillingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillingHistoryModal: React.FC<BillingHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<PaymentOrderResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await subscriptionApi.getOrderHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load billing history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
            <CheckCircle2 size={12} />
            <span>{t('subscription.status_success', 'Thành công')}</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
            <Clock size={12} />
            <span>{t('subscription.status_pending', 'Chờ thanh toán')}</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold">
            <AlertCircle size={12} />
            <span>{t('subscription.status_expired', 'Đã hết hạn')}</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-bold">
            <XCircle size={12} />
            <span>{t('subscription.status_failed', 'Thất bại')}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('subscription.billing_history_title', 'Lịch sử giao dịch & Hóa đơn')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('subscription.billing_history_subtitle', 'Danh sách các đơn nâng cấp gói đã thực hiện')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={30} className="animate-spin text-blue-600" />
              <span className="text-xs font-semibold">{t('common.loading', 'Đang tải lịch sử...')}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">{t('subscription.no_history', 'Chưa có lịch sử giao dịch nào.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">{t('subscription.order_code', 'Mã đơn')}</th>
                    <th className="pb-3">{t('subscription.plan', 'Gói')}</th>
                    <th className="pb-3">{t('subscription.amount', 'Số tiền')}</th>
                    <th className="pb-3">{t('subscription.status', 'Trạng thái')}</th>
                    <th className="pb-3">{t('subscription.date', 'Thời gian')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-mono font-semibold text-slate-800">{order.orderCode}</td>
                      <td className="py-3 font-bold text-blue-600">{order.targetPlan}</td>
                      <td className="py-3 font-extrabold text-slate-900">
                        {order.amountVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3">{renderStatusBadge(order.status)}</td>
                      <td className="py-3 text-slate-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
