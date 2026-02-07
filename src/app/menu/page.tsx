'use client';

import {
  Users,
  MapPin,
  Layers,
  UserCircle,
  Package,
  Tag,
  ArrowLeftRight,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  { name: 'Utenti', icon: Users, href: '/utenti', color: 'from-blue-500 to-blue-600' },
  { name: 'Places', icon: MapPin, href: '/places', color: 'from-green-500 to-green-600' },
  { name: 'Zones', icon: Layers, href: '/zones', color: 'from-yellow-500 to-yellow-600' },
  { name: 'Persone', icon: UserCircle, href: '/persone', color: 'from-purple-500 to-purple-600' },
  { name: 'Prodotti', icon: Package, href: '/products', color: 'from-red-500 to-red-600' },
  { name: 'Items', icon: Tag, href: '/items', color: 'from-indigo-500 to-indigo-600' },
  { name: 'Movimenti', icon: ArrowLeftRight, href: '/movimenti', color: 'from-orange-500 to-orange-600' },
  { name: 'Inventari', icon: ClipboardList, href: '/inventories', color: 'from-teal-500 to-teal-600' },
];

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Grid Menu */}
      <div className="flex justify-center px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-5xl w-full">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 flex flex-col items-center justify-center text-center p-6 aspect-square hover:-translate-y-1"
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

              {/* Icon */}
              <div className={`relative p-5 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <item.icon size={48} strokeWidth={2} />
              </div>

              {/* Label */}
              <span className="relative mt-4 text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                {item.name}
              </span>

              {/* Decorative corner */}
              <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${item.color} opacity-10 rounded-bl-3xl`}></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-sm text-gray-500">
        <p>Powered by RFID Technology</p>
      </div>
    </div>
  );
}
