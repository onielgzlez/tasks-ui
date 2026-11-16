import React from 'react';
import { cn, getAssigneeStyle, getInitials } from '../../lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'sm',
  showName = false,
  className,
}) => {
  const style = getAssigneeStyle(name);
  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        title={name}
        className={cn(
          'flex items-center justify-center font-semibold rounded-full border select-none shrink-0',
          style.bg,
          style.text,
          style.border,
          sizeClasses[size],
        )}
      >
        {initials}
      </span>
      {showName && (
        <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]" title={name}>
          {name}
        </span>
      )}
    </div>
  );
};
