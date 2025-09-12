"use client";
import Link from 'next/link';
import { Heart, Grid3X3, Phone, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { loadList } from '@/lib/listStorage';

export default function QuickActions() {
  const [listCount, setListCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        setListCount(loadList().length);
      } catch {}
    };

    updateCount();
    
    const handleStorageChange = () => updateCount();
    const handleCustomChange = () => updateCount();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('catalogue:list:changed', handleCustomChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('catalogue:list:changed', handleCustomChange as EventListener);
    };
  }, []);

  const actions = [
    {
      href: '/',
      icon: Grid3X3,
      label: 'Catalogue',
      description: 'Parcourir les produits',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    {
      href: '/liste',
      icon: Heart,
      label: 'Ma Liste',
      description: `${listCount} article${listCount !== 1 ? 's' : ''}`,
      color: 'bg-red-50 text-red-600 hover:bg-red-100',
      badge: listCount > 0 ? listCount : undefined
    },
    {
      href: 'tel:4503320894',
      icon: Phone,
      label: 'Appeler',
      description: '450 332-0894',
      color: 'bg-green-50 text-green-600 hover:bg-green-100'
    },
    {
      href: 'mailto:info@spectre-entertainment.com',
      icon: Mail,
      label: 'Email',
      description: 'Nous contacter',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`relative p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md group ${action.color}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/80">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs opacity-75 truncate">{action.description}</div>
            </div>
          </div>
          {action.badge && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {action.badge}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}