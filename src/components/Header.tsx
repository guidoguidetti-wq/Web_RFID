'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <header className="bg-white text-black shadow-md transition-all duration-300 h-28 flex items-center justify-between px-6 border-b border-gray-200">
      {/* Left: Home */}
      <div className="flex items-center w-1/3">
        {pathname !== '/login' && (
          <Link href="/menu" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
            <Home size={28} />
            <span className="font-semibold text-lg">Home</span>
          </Link>
        )}
      </div>

      {/* Center: Logo */}
      <div className="flex justify-center w-1/3">
        <div className="p-2">
             <img src="/RFID_System_Logo.png" alt="RFID System Logo" className="h-20 w-auto object-contain" />
        </div>
      </div>

      {/* Right: Logout */}
      <div className="flex justify-end w-1/3">
        {pathname !== '/login' && (
            <button 
            onClick={handleLogout}
            className="flex items-center gap-2 hover:text-red-600 transition-colors"
            title="Logout"
            >
            <span className="font-semibold text-lg">Esci</span>
            <LogOut size={28} />
            </button>
        )}
      </div>
    </header>
  );
}
