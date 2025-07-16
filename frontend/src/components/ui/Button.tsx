import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  loading = false
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        ${className}
      `}
    >
      {loading ? '読み込み中...' : children}
    </button>
  );
};