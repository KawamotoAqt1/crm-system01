import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  disabled = false,
  loading = false
}) => {
  const variantClasses = {
    primary: '',
    secondary: '',
    danger: '',
    outline: ''
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled || loading}
      style={style}
      className={`
        rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading ? '読み込み中...' : children}
    </button>
  );
};