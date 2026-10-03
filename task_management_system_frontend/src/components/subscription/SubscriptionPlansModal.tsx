import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Check,
  Zap,
  Crown,
  Sparkles,
  Loader2,
  HelpCircle,
  FolderKanban,
  Users,
  HardDrive,
  FileType,
} from 'lucide-react';
import {
  SubscriptionPlan,
  SubscriptionPlanDTO,
  SubscriptionSummaryDTO,
  PaymentOrderResponseDTO,
  subscriptionApi,
} from '../../services/subscriptionApi';
import { PaymentModal } from './PaymentModal';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSummary?: SubscriptionSummaryDTO | null;
  onSubscriptionUpdated?: () => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  currentSummary,
  onSubscriptionUpdated,
}) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlanDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrderResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await subscriptionApi.getPlans();
        setPlans(data);
      } catch (err: any) {
        console.error('Failed to load subscription plans:', err);
        setError(err.response?.data?.message || 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlan = currentSummary?.plan || 'STARTER';

  const handleCheckout = async (targetPlan: SubscriptionPlan) => {
    if (targetPlan === currentPlan) return;

    try {
      setCheckoutLoadingPlan(targetPlan);
      setError(null);
      const order = await subscriptionApi.createCheckoutOrder(targetPlan);
      setActivePaymentOrder(order);
    } catch (err: any) {
      console.error('Failed to create checkout order:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setCheckoutLoadingPlan(null);
    }
  };

  const handlePaymentSuccess = () => {
    setActivePaymentOrder(null);
    if (onSubscriptionUpdated) {
      onSubscriptionUpdated();
    }
    onClose();
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'STARTER':
        return <Zap size={20} className="text-slate-600" />;
      case 'PRO':
        return <Sparkles size={20} className="text-blue-600" />;
      case 'ENTERPRISE':
        return <Crown size={20} className="text-amber-600" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 my-8 flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-300 backdrop-blur-xs border border-white/10 mb-1">
                <Sparkles size={14} />
                <span>{t('subscription.pricing_badge', 'Nâng cấp gói tài khoản')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {t('subscription.modal_title', 'Mở rộng tiềm năng với các gói linh hoạt')}
              </h2>
              <p className="text-sm text-slate-300">
                {t('subscription.modal_subtitle', 'Tăng dung lượng lưu trữ, mở rộng số lượng dự án và kết nối toàn bộ đội ngũ của bạn.')}
              </p>

              {/* Currency Toggle */}
              <div className="pt-2 flex items-center justify-center">
                <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/10 text-xs font-bold">
                  <button
                    onClick={() => setCurrency('VND')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      currency === 'VND' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    VNĐ (đ)
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      currency === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 size={36} className="animate-spin text-blue-600" />
                <span className="text-xs font-semibold">{t('common.loading', 'Đang tải thông tin gói...')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((p) => {
                  const isCurrent = p.id === currentPlan;
                  const isPro = p.id === 'PRO';
                  const isEnterprise = p.id === 'ENTERPRISE';

                  return (
                    <div
                      key={p.id}
                      className={`relative rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                        isPro
                          ? 'bg-white border-2 border-blue-600 shadow-xl shadow-blue-500/10 scale-102 z-10'
                          : isEnterprise
                          ? 'bg-white border border-amber-200 shadow-md hover:shadow-lg'
                          : 'bg-white border border-slate-200 shadow-xs hover:shadow-md'
                      }`}
                    >
                      {/* Popular Badge */}
                      {p.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold rounded-full shadow-md uppercase tracking-wider">
                          {t('subscription.most_popular', 'Phổ biến nhất')}
                        </div>
                      )}

                      <div className="p-6 space-y-5">
                        {/* Plan Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${
                              isPro ? 'bg-blue-50' : isEnterprise ? 'bg-amber-50' : 'bg-slate-100'
                            }`}>
                              {getPlanIcon(p.id)}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                              <p className="text-[11px] text-slate-500">
                                {p.id === 'STARTER' ? t('subscription.for_individuals', 'Cá nhân & Nhóm nhỏ') : p.id === 'PRO' ? t('subscription.for_growing_teams', 'Đội nhóm đang phát triển') : t('subscription.for_enterprises', 'Doanh nghiệp lớn')}
                              </p>
                            </div>
                          </div>

                          {isCurrent && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg uppercase tracking-wide border border-slate-200">
                              {t('subscription.current_plan', 'Gói hiện tại')}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="pt-2">
                          {p.priceVnd === 0 ? (
                            <div className="text-3xl font-black text-slate-900">
                              {t('subscription.free', 'Miễn phí')}
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900">
                                {currency === 'VND'
                                  ? `${p.priceVnd.toLocaleString('vi-VN')} đ`
                                  : `$${p.priceUsd}`}
                              </span>
                              <span className="text-xs text-slate-500 font-semibold">
                                /{t('subscription.month', 'tháng')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Core Quota Highlights */}
                        <div className="space-y-2 pt-2 pb-2 border-y border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <FolderKanban size={15} className="text-slate-400 shrink-0" />
                            <span>
                              {p.maxProjects === 2147483647
                                ? t('subscription.unlimited_projects', 'Không giới hạn dự án')
                                : `${t('subscription.up_to', 'Tối đa')} ${p.maxProjects} ${t('subscription.projects', 'dự án')}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={15} className="text-slate-400 shrink-0" />
                            <span>
                              {p.maxUniqueMembers === 2147483647
                                ? t('subscription.unlimited_members', 'Không giới hạn thành viên')
                                : `${t('subscription.up_to', 'Tối đa')} ${p.maxUniqueMembers} ${t('subscription.members', 'thành viên duy nhất')}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HardDrive size={15} className="text-slate-400 shrink-0" />
                            <span>
                              {p.id === 'STARTER' ? '5GB Cloud Storage' : p.id === 'PRO' ? '20GB High-Speed Storage' : '100GB Enterprise Storage'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileType size={15} className="text-slate-400 shrink-0" />
                            <span>
                              {p.allowedFileTypes.join(', ')} (Max {p.id === 'STARTER' ? '5MB' : p.id === 'PRO' ? '10MB' : '5GB'}/file)
                            </span>
                          </div>
                        </div>

                        {/* Detailed Features */}
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('subscription.features_included', 'Tính năng bao gồm')}
                          </div>
                          <ul className="space-y-2 text-xs text-slate-600">
                            {p.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="p-6 pt-0">
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200"
                          >
                            {t('subscription.active_plan', 'Đang sử dụng')}
                          </button>
                        ) : p.id === 'STARTER' ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200"
                          >
                            {t('subscription.default_free', 'Gói mặc định')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckout(p.id)}
                            disabled={checkoutLoadingPlan !== null}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                              isPro
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            } disabled:opacity-50`}
                          >
                            {checkoutLoadingPlan === p.id ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>{t('subscription.creating_order', 'Đang tạo đơn...')}</span>
                              </>
                            ) : (
                              <>
                                <Zap size={15} />
                                <span>{t('subscription.upgrade_to', 'Nâng cấp lên')} {p.name}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment QR Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};
