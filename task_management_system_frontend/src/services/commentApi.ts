import apiClient from './apiClient';
import { UserDTO } from './taskApi';

export interface TaskCommentAttachmentDTO {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  createdAt?: string;
}

export interface TaskCommentDTO {
  id: number;
  content: string;
  taskId: number;
  user: UserDTO;
  parentId?: number | null;
  replies?: TaskCommentDTO[];
  attachments?: TaskCommentAttachmentDTO[];
  createdAt: string;
  updatedAt?: string;
}

export const commentApi = {
  getCommentsByTaskId: async (taskId: number): Promise<TaskCommentDTO[]> => {
    const res = await apiClient.get<TaskCommentDTO[]>(`/tasks/${taskId}/comments`);
    return res.data;
  },

  createComment: async (
    taskId: number,
    content: string,
    parentId?: number | null,
    files?: File[]
  ): Promise<TaskCommentDTO> => {
    const formData = new FormData();
    formData.append('content', content);
    if (parentId) {
      formData.append('parentId', parentId.toString());
    }
    if (files && files.length > 0) {
      files.forEach((file) => formData.append('files', file));
    }

    const res = await apiClient.post<TaskCommentDTO>(`/tasks/${taskId}/comments`, formData);
    return res.data;
  },

  updateComment: async (commentId: number, content: string): Promise<TaskCommentDTO> => {
    const res = await apiClient.put<TaskCommentDTO>(`/tasks/comments/${commentId}`, { content });
    return res.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/tasks/comments/${commentId}`);
  },
};
