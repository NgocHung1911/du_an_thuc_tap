import apiClient from './apiClient';

export type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';
export type OrderStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';

export interface SubscriptionPlanDTO {
  id: SubscriptionPlan;
  name: string;
  priceVnd: number;
  priceUsd: number;
  isPopular: boolean;
  maxProjects: number;
  maxUniqueMembers: number;
  maxFileSizeBytes: number;
  maxStorageBytes: number;
  allowedFileTypes: string[];
  features: string[];
}

export interface SubscriptionSummaryDTO {
  id: number | null;
  plan: SubscriptionPlan;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  isExpired: boolean;
  daysRemaining: number | null;
  currentProjects: number;
  maxProjects: number;
  currentUniqueMembers: number;
  maxUniqueMembers: number;
  usedStorageBytes: number;
  maxStorageBytes: number;
  maxFileSizeBytes: number;
  allowedFileTypes: string[];
}

export interface PaymentOrderResponseDTO {
  id: number;
  orderCode: string;
  targetPlan: SubscriptionPlan;
  amountVnd: number;
  amountUsd: number;
  status: OrderStatus;
  bankId: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrCodeUrl: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  remainingSeconds: number;
}

export const subscriptionApi = {
  // Lấy danh sách các gói subscription
  getPlans: async (): Promise<SubscriptionPlanDTO[]> => {
    const res = await apiClient.get<SubscriptionPlanDTO[]>('/subscriptions/plans');
    return res.data;
  },

  // Lấy thông tin gói & mức sử dụng quota hiện tại của user
  getMySubscription: async (): Promise<SubscriptionSummaryDTO> => {
    const res = await apiClient.get<SubscriptionSummaryDTO>('/subscriptions/me');
    return res.data;
  },

  // Tạo đơn hàng thanh toán nâng cấp gói
  createCheckoutOrder: async (targetPlan: SubscriptionPlan): Promise<PaymentOrderResponseDTO> => {
    const res = await apiClient.post<PaymentOrderResponseDTO>('/subscriptions/checkout', {
      targetPlan,
    });
    return res.data;
  },

  // Kiểm tra chi tiết đơn hàng (polling)
  getOrderDetails: async (orderCode: string): Promise<PaymentOrderResponseDTO> => {
    const res = await apiClient.get<PaymentOrderResponseDTO>(`/subscriptions/orders/${orderCode}`);
    return res.data;
  },

  // Lịch sử thanh toán
  getOrderHistory: async (): Promise<PaymentOrderResponseDTO[]> => {
    const res = await apiClient.get<PaymentOrderResponseDTO[]>('/subscriptions/orders/history');
    return res.data;
  },
};
