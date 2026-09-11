import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Paperclip, Send, Loader2, RefreshCw, X, AlertCircle, Sparkles
} from 'lucide-react';
import { commentApi, TaskCommentDTO } from '../../services/commentApi';
import { UserDTO } from '../../services/taskApi';
import { userApi } from '../../services/userApi';
import { CommentItem } from './CommentItem';
import { useProjectWebSocket } from '../../hooks/useWebSocket';
import { UserAvatar } from '../common/UserAvatar';

interface TaskCommentSectionProps {
  taskId: number;
  projectId?: number;
  projectMembers?: UserDTO[];
  currentUserId?: number;
  currentUsername?: string;
  currentUserFullName?: string;
  currentUserAvatarUrl?: string;
  isAdminOrOwner?: boolean;
}

export const TaskCommentSection: React.FC<TaskCommentSectionProps> = ({
  taskId,
  projectId,
  projectMembers = [],
  currentUserId,
  currentUsername,
  currentUserFullName,
  currentUserAvatarUrl,
  isAdminOrOwner = false,
}) => {
  const [comments, setComments] = useState<TaskCommentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserDTO | null>(null);

  useEffect(() => {
    userApi.getCurrentUser()
      .then((u) => setCurrentUserProfile(u))
      .catch((err) => console.error('Failed to load user profile in comment section:', err));
  }, []);

  // Main comment box state
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState<boolean>(false);

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = currentUserFullName || currentUsername || 'You';

  // Fetch task comments
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commentApi.getCommentsByTaskId(taskId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load task comments:', err);
      setComments([]);
      if (err.response?.status && err.response.status >= 500) {
        setError('Server error loading comments.');
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Listen for Real-Time WebSocket Comment Events
  useProjectWebSocket(
    projectId,
    useCallback(
      (event: any) => {
        const type = event?.eventType || event?.type;
        if (
          type === 'COMMENT_CREATED' ||
          type === 'COMMENT_UPDATED' ||
          type === 'COMMENT_DELETED'
        ) {
          const targetTaskId = event?.taskId || event?.data?.taskId;
          if (!targetTaskId || Number(targetTaskId) === Number(taskId)) {
            fetchComments();
          }
        }
      },
      [taskId, fetchComments]
    )
  );

  // File Select Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Mention logic
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.slice(lastAtSymbol + 1);
      if (!query.includes(' ') && query.length <= 20) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: UserDTO) => {
    const name = member.fullName || member.username;
    const tag = `@${name} `;

    if (textareaRef.current) {
      const val = content;
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = val.slice(0, cursorPos);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

      const newVal = val.slice(0, lastAtSymbol) + tag + val.slice(cursorPos);
      setContent(newVal);
      setShowMentions(false);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = lastAtSymbol + tag.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 50);
    }
  };

  const filteredMembers = projectMembers.filter((m) => {
    const name = (m.fullName || m.username).toLowerCase();
    return name.includes(mentionQuery.toLowerCase());
  });

  // Post top-level comment
  const handlePostComment = async () => {
    if (!content.trim() && files.length === 0) return;
    try {
      setPosting(true);
      await commentApi.createComment(taskId, content.trim(), null, files);
      setContent('');
      setFiles([]);
      await fetchComments();
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again!');
    } finally {
      setPosting(false);
    }
  };

  // Reply handler
  const handleReplyComment = async (parentId: number, replyText: string, replyFiles?: File[]) => {
    await commentApi.createComment(taskId, replyText, parentId, replyFiles);
    await fetchComments();
  };

  // Edit handler
  const handleEditComment = async (commentId: number, newContent: string) => {
    await commentApi.updateComment(commentId, newContent);
    await fetchComments();
  };

  // Delete handler
  const handleDeleteComment = async (commentId: number) => {
    await commentApi.deleteComment(commentId);
    await fetchComments();
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600" />
          <span>Activity & Comments</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-slate-200">
            {comments.length}
          </span>
        </h3>

        <button
          type="button"
          onClick={fetchComments}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh comments"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Add Comment Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3 relative">
        <div className="flex gap-3">
          <UserAvatar
            src={currentUserProfile?.avatarUrl || currentUserAvatarUrl}
            name={currentUserProfile?.fullName || currentUserProfile?.username || displayName}
            size="w-8 h-8"
            textSize="text-xs"
          />

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              placeholder="Add a comment... (Type @ to tag team members)"
              rows={3}
              className="w-full text-xs text-slate-900 bg-slate-50 hover:bg-white focus:bg-white p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 transition-colors resize-y"
            />

            {/* @Mention Autocomplete Dropdown */}
            {showMentions && filteredMembers.length > 0 && (
              <div className="absolute left-0 bottom-full mb-1 w-64 bg-white rounded-xl border border-slate-200 shadow-2xl max-h-48 overflow-y-auto z-40 p-1">
                <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Tag Team Member
                </p>
                {filteredMembers.map((mem) => (
                  <div
                    key={mem.id}
                    onClick={() => insertMention(mem)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <UserAvatar src={mem.avatarUrl} name={mem.fullName || mem.username} size="w-5 h-5" textSize="text-[9px]" />
                    <span className="font-bold truncate">{mem.fullName || mem.username}</span>
                    <span className="text-[10px] text-slate-400 truncate">({mem.email || mem.username})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected File Badges */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-11">
            {files.map((file, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
              >
                <Paperclip size={12} className="text-slate-400" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-600 ml-1"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Card Action Footer */}
        <div className="flex items-center justify-between pl-11 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Paperclip size={14} />
            <span>Attach image/video/file</span>
          </button>

          <button
            type="button"
            onClick={handlePostComment}
            disabled={posting || (!content.trim() && files.length === 0)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>Comment</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Comment List Threads */}
      {loading && comments.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
          <Sparkles size={24} className="mx-auto text-slate-300 mb-1" />
          <p className="text-xs font-semibold text-slate-600">No comments yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Start the conversation by adding a comment above!</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2 pb-10">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              projectMembers={projectMembers}
              isAdminOrOwner={isAdminOrOwner}
              onReply={handleReplyComment}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};
