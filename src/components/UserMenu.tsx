import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserMenuProps {
  onSettingsClick?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onSettingsClick }) => {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentUser) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-[#1B1F24] transition-colors cursor-pointer group"
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="w-7 h-7 rounded-full border border-[#292D33] flex-shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {currentUser.displayName?.[0] ?? currentUser.email?.[0] ?? 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0 text-left hidden lg:block">
          <p className="text-xs font-semibold text-[#F5F5F5] truncate">
            {currentUser.displayName ?? 'Trader'}
          </p>
          <p className="text-[10px] text-[#6F7680] truncate">{currentUser.email}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#6F7680] transition-transform hidden lg:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1B1F24] border border-[#292D33] rounded-xl shadow-2xl overflow-hidden z-50 min-w-[180px]">
          {/* Profile info */}
          <div className="px-4 py-3 border-b border-[#292D33]">
            <p className="text-xs font-bold text-[#F5F5F5] truncate">
              {currentUser.displayName ?? 'Trader'}
            </p>
            <p className="text-[10px] text-[#6F7680] truncate">{currentUser.email}</p>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <button
              onClick={() => { onSettingsClick?.(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#A0A6AE] hover:text-[#F5F5F5] hover:bg-[#292D33] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
