import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showPageNumbers = 5,
  className = ''
}) => {
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(showPageNumbers / 2));
    let endPage = Math.min(totalPages, startPage + showPageNumbers - 1);
    
    if (endPage - startPage < showPageNumbers - 1) {
      startPage = Math.max(1, endPage - showPageNumbers + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 件数表示 */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">{startIndex}</span> から{' '}
        <span className="font-medium">{endIndex}</span> まで表示（全{' '}
        <span className="font-medium">{totalItems}</span> 件中）
      </div>

      {/* ページネーション */}
      <div className="flex items-center space-x-1">
        {/* 前へボタン */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            relative inline-flex items-center px-3 py-2 text-sm font-medium 
            text-gray-500 bg-white border border-gray-300 rounded-md 
            hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          前へ
        </button>

        {/* ページ番号 */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              relative inline-flex items-center px-3 py-2 text-sm font-medium 
              border rounded-md focus:z-10 focus:ring-2 focus:ring-blue-500
              ${page === currentPage
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {page}
          </button>
        ))}

        {/* 次へボタン */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            relative inline-flex items-center px-3 py-2 text-sm font-medium 
            text-gray-500 bg-white border border-gray-300 rounded-md 
            hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          次へ
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};