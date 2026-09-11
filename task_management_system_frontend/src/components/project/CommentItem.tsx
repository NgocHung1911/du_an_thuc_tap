import React, { useState, useRef, useEffect } from 'react';
import {
  Reply, Edit3, Trash2, ThumbsUp, Smile, Paperclip, FileText, Image as ImageIcon,
  Video, Download, ExternalLink, Send, X, CornerDownRight, Loader2
} from 'lucide-react';
import { TaskCommentDTO, TaskCommentAttachmentDTO } from '../../services/commentApi';
import { UserDTO } from '../../services/taskApi';
import { UserAvatar } from '../common/UserAvatar';

interface CommentItemProps {
  comment: TaskCommentDTO;
  currentUserId?: number;
  currentUsername?: string;
  projectMembers?: UserDTO[];
  isAdminOrOwner?: boolean;
  onReply: (parentId: number, content: string, files?: File[]) => Promise<void>;
  onEdit: (commentId: number, newContent: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  currentUsername,
  projectMembers = [],
  isAdminOrOwner = false,
  onReply,
  onEdit,
  onDelete,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [submittingReply, setSubmittingReply] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(false);

  // Mention Autocomplete state for Reply Box
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthor = Boolean(
    currentUsername &&
      ((comment.user?.username && comment.user.username.toLowerCase() === currentUsername.toLowerCase()) ||
        (comment.user?.email && comment.user.email.toLowerCase() === currentUsername.toLowerCase()))
  );

  const canEdit = isAuthor || isAdminOrOwner;
  const canDelete = isAuthor || isAdminOrOwner;

  // Format date
  const formattedDate = React.useMemo(() => {
    if (!comment.createdAt) return '';
    try {
      const d = new Date(comment.createdAt);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return comment.createdAt;
    }
  }, [comment.createdAt]);

  const authorName = comment.user?.fullName || comment.user?.username || 'User';

  // Handle Reply File Select
  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReplyFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeReplyFile = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Submit Reply
  const handleSendReply = async () => {
    if (!replyContent.trim() && replyFiles.length === 0) return;
    try {
      setSubmittingReply(true);
      await onReply(comment.id, replyContent.trim(), replyFiles);
      setReplyContent('');
      setReplyFiles([]);
      setIsReplying(false);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle Submit Edit
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      setSubmittingEdit(true);
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit comment:', err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete
  const handleDeleteComment = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        setDeleting(true);
        await onDelete(comment.id);
      } catch (err) {
        console.error('Failed to delete comment:', err);
        setDeleting(false);
      }
    }
  };

  // Mention Detection in Reply
  const handleReplyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.slice(lastAtSymbol + 1);
      if (!query.includes(' ') && query.length <= 20) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: UserDTO) => {
    const name = member.fullName || member.username;
    const tag = `@${name} `;

    if (replyInputRef.current) {
      const val = replyContent;
      const cursorPos = replyInputRef.current.selectionStart;
      const textBeforeCursor = val.slice(0, cursorPos);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

      const newVal = val.slice(0, lastAtSymbol) + tag + val.slice(cursorPos);
      setReplyContent(newVal);
      setShowMentions(false);

      setTimeout(() => {
        if (replyInputRef.current) {
          replyInputRef.current.focus();
          const newPos = lastAtSymbol + tag.length;
          replyInputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 50);
    }
  };

  const filteredMembers = projectMembers.filter((m) => {
    const name = (m.fullName || m.username).toLowerCase();
    return name.includes(mentionQuery.toLowerCase());
  });

  // Collect all project member full names and usernames sorted by length descending
  const validNames = React.useMemo(() => {
    const namesSet = new Set<string>();
    if (projectMembers && projectMembers.length > 0) {
      projectMembers.forEach((m) => {
        if (m.fullName && m.fullName.trim()) namesSet.add(m.fullName.trim());
        if (m.username && m.username.trim()) namesSet.add(m.username.trim());
      });
    }
    if (comment.user?.fullName) namesSet.add(comment.user.fullName.trim());
    if (comment.user?.username) namesSet.add(comment.user.username.trim());

    return Array.from(namesSet).sort((a, b) => b.length - a.length);
  }, [projectMembers, comment.user]);

  // Render comment text with styled @mention pills
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    if (validNames.length > 0) {
      const escapedNames = validNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`(@(?:${escapedNames.join('|')}))(?=\\s|$|[.,!?\\):;])`, 'g');
      const parts = text.split(regex);

      return parts.map((part, i) => {
        if (part.startsWith('@') && validNames.some((n) => part === `@${n}`)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 shadow-2xs cursor-pointer hover:bg-blue-200 transition-colors"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      });
    }

    const fallbackRegex = /(@[\w\u00C0-\u024F\u1E00-\u1EFF\s\-]+?)(?=\s[a-z0-9]|$|[.,!?\):;])/gi;
    const parts = text.split(fallbackRegex);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 shadow-2xs cursor-pointer hover:bg-blue-200 transition-colors"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex gap-3 group relative transition-all duration-200">
      {/* Hidden File Input for Reply */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleReplyFileChange}
        multiple
        className="hidden"
      />

      {/* Author Avatar */}
      <div className="shrink-0 pt-0.5">
        <UserAvatar
          src={comment.user?.avatarUrl}
          name={authorName}
          size="w-8 h-8"
          textSize="text-xs"
        />
      </div>

      {/* Main Comment Content & Actions */}
      <div className="flex-1 space-y-1.5 min-w-0">
        {/* Comment Header: Author & Date */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900 leading-none">{authorName}</span>
          <span className="text-[11px] text-slate-400 leading-none">{formattedDate}</span>
        </div>

        {/* Comment Body / Edit View */}
        {isEditing ? (
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-blue-300">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 resize-y min-h-[60px]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submittingEdit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1"
              >
                {submittingEdit ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-800 leading-relaxed break-words">
            {renderFormattedContent(comment.content)}
          </div>
        )}

        {/* Comment Attachments Chips / Previews */}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {comment.attachments.map((att) => {
              const isImage = att.fileType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.fileName);
              const isVideo = att.fileType?.startsWith('video/') || /\.(mp4|webm|mkv)$/i.test(att.fileName);

              return (
                <div
                  key={att.id}
                  className="group/att relative bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 max-w-xs transition-colors cursor-pointer"
                  onClick={() => window.open(att.fileUrl, '_blank')}
                  title={att.fileName}
                >
                  {isImage ? (
                    <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden shrink-0">
                      <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                    </div>
                  ) : isVideo ? (
                    <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Video size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      <FileText size={16} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                      {att.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Attachment'}
                    </p>
                  </div>

                  <ExternalLink size={12} className="text-slate-400 group-hover/att:text-blue-600 shrink-0" />
                </div>
              );
            })}
          </div>
        )}

        {/* Action Toolbar: Reply, Like, Reaction, Edit, Delete */}
        <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-500 font-medium select-none">
          <button
            type="button"
            onClick={() => {
              if (!isReplying) {
                setIsReplying(true);
                const tagText = `@${authorName} `;
                setReplyContent(tagText);
                setTimeout(() => {
                  if (replyInputRef.current) {
                    replyInputRef.current.focus();
                    replyInputRef.current.setSelectionRange(tagText.length, tagText.length);
                  }
                }, 50);
              } else {
                setIsReplying(false);
              }
            }}
            className="hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <Reply size={13} />
            <span>Reply</span>
          </button>

          <button
            type="button"
            onClick={() => setLiked(!liked)}
            className={`hover:text-blue-600 flex items-center gap-1 transition-colors ${liked ? 'text-blue-600 font-bold' : ''}`}
          >
            <ThumbsUp size={13} className={liked ? 'fill-blue-600' : ''} />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="hover:text-slate-800 flex items-center gap-1 transition-colors"
              title="Edit comment"
            >
              <Edit3 size={13} />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteComment}
              disabled={deleting}
              className="hover:text-red-600 flex items-center gap-1 transition-colors"
              title="Delete comment"
            >
              {deleting ? <Loader2 size={13} className="animate-spin text-red-500" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>

        {/* Inline Reply Editor */}
        {isReplying && (
          <div className="mt-2 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3 relative">
            <div className="flex items-start gap-2">
              <CornerDownRight size={14} className="text-slate-400 shrink-0 mt-2" />
              <div className="flex-1 relative">
                <textarea
                  ref={replyInputRef}
                  value={replyContent}
                  onChange={handleReplyTextChange}
                  placeholder={`Reply to ${authorName}... (Use @ to tag member)`}
                  rows={2}
                  className="w-full text-xs text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 resize-y"
                />

                {/* @Mention Autocomplete Dropdown */}
                {showMentions && filteredMembers.length > 0 && (
                  <div className="absolute left-0 bottom-full mb-1 w-64 bg-white rounded-xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto z-30 p-1">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Tag Member
                    </p>
                    {filteredMembers.map((mem, idx) => (
                      <div
                        key={mem.id}
                        onClick={() => insertMention(mem)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                          idx === mentionIndex ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <UserAvatar src={mem.avatarUrl} name={mem.fullName || mem.username} size="w-5 h-5" textSize="text-[9px]" />
                        <span className="truncate">{mem.fullName || mem.username}</span>
                        <span className="text-[10px] text-slate-400 truncate">({mem.email || mem.username})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attached Files List for Reply */}
            {replyFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-6">
                {replyFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700 shadow-2xs"
                  >
                    <Paperclip size={11} className="text-slate-400" />
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeReplyFile(idx)}
                      className="text-slate-400 hover:text-red-600 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Reply Actions Footer */}
            <div className="flex items-center justify-between pl-6 pt-1 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                title="Attach file/image/video"
              >
                <Paperclip size={13} />
                <span>Attach</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                    setReplyFiles([]);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={submittingReply || (!replyContent.trim() && replyFiles.length === 0)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  {submittingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Threaded Replies with Vertical Connecting Line */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-4 border-l-2 border-slate-200 space-y-3 pt-2 mt-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                projectMembers={projectMembers}
                isAdminOrOwner={isAdminOrOwner}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
