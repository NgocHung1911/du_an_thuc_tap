import apiClient from './apiClient';

export interface InvitationVerifyResponse {
  token: string;
  email: string;
  projectId: number;
  projectName: string;
  projectDescription?: string;
  status: string;
  isRegistered: boolean;
  registered?: boolean;
  isExpired: boolean;
  expired?: boolean;
  isAccepted?: boolean;
  accepted?: boolean;
  isValid: boolean;
  valid?: boolean;
}

export interface AcceptInvitationResponse {
  message: string;
  projectId: number;
  projectName: string;
}

export const invitationApi = {

  // Gửi email lời mời tham gia dự án (Admin/Member)
  sendInvitation: async (projectId: number, email: string): Promise<AcceptInvitationResponse> => {
    const res = await apiClient.post<AcceptInvitationResponse>(`/projects/${projectId}/invite`, {
      email: email.trim(),
    });
    return res.data;
  },

  // Verify token lời mời từ URL (Chuẩn hóa thuộc tính boolean để tương thích ngược)
  verifyInvitationToken: async (token: string): Promise<InvitationVerifyResponse> => {
    const res = await apiClient.get<any>('/invitations/verify', {
      params: { token: token.trim() },
    });
    const data = res.data;
    return {
      ...data,
      isValid: Boolean(data.isValid ?? data.valid ?? false),
      isRegistered: Boolean(data.isRegistered ?? data.registered ?? false),
      isAccepted: Boolean(data.isAccepted ?? data.accepted ?? false),
      isExpired: Boolean(data.isExpired ?? data.expired ?? false),
    };
  },

  // Chấp nhận lời mời & tự động tham gia dự án
  acceptInvitation: async (token: string): Promise<AcceptInvitationResponse> => {
    const res = await apiClient.post<AcceptInvitationResponse>('/invitations/accept', null, {
      params: { token: token.trim() },
    });
    return res.data;
  },
};
