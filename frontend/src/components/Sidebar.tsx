'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, User, BookUser, ChevronUp, ChevronDown, Shield, LogOut } from 'lucide-react';
import { useAppState } from '@/lib/store';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Persona', href: '/persona', icon: User },
  { label: 'Contacts', href: '/contacts', icon: BookUser },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sa_state');
    router.push('/');
  };

  return (
    <aside className="w-[200px] min-h-screen flex flex-col border-r"
      style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'var(--accent)' }}>SA</div>
        <div>
          <div className="font-semibold text-sm leading-tight">SpeakerAgent.ai</div>
          <div className="text-[11px] text-gray-500">Command Center</div>
        </div>
      </div>

      {/* Nav */}
      <div className="px-3 mt-2">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
          Application
        </div>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                active
                  ? 'font-semibold text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
              style={active ? { background: 'var(--sidebar-active)' } : {}}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        {/* Admin link */}
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-6">
          Admin
        </div>
        <Link href="/admin"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
            pathname.startsWith('/admin')
              ? 'font-semibold text-gray-900'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
          style={pathname.startsWith('/admin') ? { background: 'var(--sidebar-active)' } : {}}>
          <Shield size={16} />
          Admin Panel
        </Link>
      </div>

      {/* Bottom */}
      <div className="mt-auto px-3 pb-4 relative" ref={menuRef}>
        {showMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/60 rounded-lg">
          <User size={16} className="text-gray-500" />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium truncate">My Account</div>
            <div className="text-[11px] text-gray-400">Manage profile</div>
          </div>
          {showMenu ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
        </button>
      </div>
    </aside>
  );
}
