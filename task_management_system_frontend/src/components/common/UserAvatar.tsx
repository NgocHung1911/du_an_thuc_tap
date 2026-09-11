import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: string;
  className?: string;
  textSize?: string;
  title?: string;
  alt?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'w-8 h-8',
  className = '',
  textSize = 'text-xs',
  title,
  alt,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getInitials = (str?: string | null) => {
    if (!str || !str.trim()) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (str?: string | null) => {
    if (!str) return 'bg-blue-600';
    const colors = [
      'bg-blue-600',
      'bg-red-500',
      'bg-amber-500',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-teal-600',
      'bg-indigo-600',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const displayTitle = title || name || 'User';
  const displayAlt = alt || name || 'Avatar';

  const hasValidSrc = Boolean(src && typeof src === 'string' && src.trim().length > 0);

  if (hasValidSrc && !imgError) {
    return (
      <img
        src={src as string}
        alt={displayAlt}
        title={displayTitle}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      title={displayTitle}
      className={`${size} rounded-full text-white font-bold flex items-center justify-center shrink-0 shadow-2xs ${bgColor} ${textSize} ${className}`}
    >
      {initials}
    </div>
  );
};
