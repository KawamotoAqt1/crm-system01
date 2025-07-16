// ==============================================
// src/components/ui/Avatar.tsx
// ==============================================
import React from 'react';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  firstName, 
  lastName, 
  size = 'md', 
  imageUrl,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  const getInitials = (first: string, last: string) => {
    return `${last.charAt(0)}${first.charAt(0)}`;
  };

  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <img 
          src={imageUrl} 
          alt={`${lastName} ${firstName}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center ${className}`}>
      <span className="font-medium text-gray-700">
        {getInitials(firstName, lastName)}
      </span>
    </div>
  );
};