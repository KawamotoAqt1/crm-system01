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

const MapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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

const SidebarNew: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-red-800">
      <div className="h-full">
        <nav className="flex-1 p-6">
          <ul className="flex flex-col space-y-2">
            <NavItem to="/dashboard" icon={<DashboardIcon />}>
              📊 NEW ダッシュボード
            </NavItem>

            <NavItem to="/employees" icon={<UsersIcon />}>
              👥 社員管理
            </NavItem>

            <NavItem to="/departments" icon={<BuildingIcon />}>
              🏢 部署管理
            </NavItem>

            <NavItem to="/areas" icon={<MapIcon />} badge="NEW">
              🗺️ エリア管理
            </NavItem>

            <NavItem to="/positions" icon={<BadgeIcon />}>
              🏷️ 役職管理
            </NavItem>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default SidebarNew; 