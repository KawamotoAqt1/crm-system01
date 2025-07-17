// frontend/src/components/layout/Sidebar.tsx - 部署管理メニュー追加
import React from 'react';
import { NavLink } from 'react-router-dom';

// アイコンコンポーネント
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string | number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, children, badge }) => {
  return (
    <li className="w-full">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `group flex items-center px-4 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${
            isActive
              ? 'bg-gray-900 text-white shadow-md'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`
        }
      >
        <span className={`mr-3 flex-shrink-0`}>
          {icon}
        </span>
        <span className="flex-1">{children}</span>
        {badge && (
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
            {badge}
          </span>
        )}
      </NavLink>
    </li>
  );
};

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800">
      <div className="h-full">
        {/* ナビゲーション */}
        <nav className="flex-1 p-6">
          <ul className="flex flex-col space-y-2">
            {/* ダッシュボード */}
            <NavItem to="/dashboard" icon={<DashboardIcon />}>
              ダッシュボード
            </NavItem>

            {/* セパレータ */}
            <li className="my-4 border-t border-gray-700"></li>
            
            {/* 基本管理機能 */}
            <li className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                基本管理
              </h3>
            </li>

            {/* 社員管理 */}
            <NavItem to="/employees" icon={<UsersIcon />}>
              社員管理
            </NavItem>

            {/* 部署管理 - 新規追加 */}
            <NavItem to="/departments" icon={<BuildingIcon />}>
              部署管理
            </NavItem>

            {/* 役職管理 */}
            <NavItem to="/positions" icon={<BadgeIcon />}>
              役職管理
            </NavItem>

            {/* セパレータ */}
            <li className="my-4 border-t border-gray-700"></li>
            
            {/* 拡張機能 */}
            <li className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                拡張機能
              </h3>
            </li>

            {/* 案件管理 */}
            <NavItem to="/projects" icon={<BriefcaseIcon />}>
              案件管理
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-600 text-white rounded-full">
                準備中
              </span>
            </NavItem>

            {/* 顧客管理 */}
            <NavItem to="/customers" icon={<UserGroupIcon />}>
              顧客管理
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-600 text-white rounded-full">
                準備中
              </span>
            </NavItem>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;