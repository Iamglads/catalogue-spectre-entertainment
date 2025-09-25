"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Phone, ExternalLink, ChevronDown, Grid3X3, Heart, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ListCounter from './ListCounter';
// Theme toggle removed; default to light theme
import UserButton from '../user-button';

type Category = {
  _id: string;
  name: string;
  fullPath: string;
  depth: number;
  parentId: string | null;
};

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.items || []))
      .catch(console.error);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => {
      setCategoriesOpen(false);
    };
    if (categoriesOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [categoriesOpen]);

  const mainCategories = categories.filter(cat => cat.depth === 0);
  const getSubCategories = (parentId: string) => 
    categories.filter(cat => cat.parentId === parentId);



  const adminItems = isAdmin ? [
    { href: '/admin', label: 'Administration', icon: Settings },
    { href: '/admin/products', label: 'Produits' },
    { href: '/admin/categories', label: 'Catégories' },
    { href: '/admin/quotes', label: 'Soumissions' },
  ] : [];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50">
        <div className="w-full">
          {/* Single-line header: logo + contacts + actions */}
          <div className="flex max-w-7xl mx-auto items-center justify-between h-16 px-6 gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src="/Logo.png" 
                alt="Spectre Entertainment" 
                width={100} 
                height={40} 
                className="h-6 w-auto transition-transform group-hover:scale-105" 
              />
            </Link>


            {/* Right side actions */}
            <div className="flex items-center gap-3">
              
              <Link
                href="https://spectre-entertainment.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:text-brand transition-colors"
              >
                Retourner au site
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="tel:4503320894" className="hidden md:inline-flex bg-[#007aff] text-white font-semibold items-center gap-2 px-2 py-1 rounded hover:opacity-90 transition-colors">
                <Phone className="h-4 w-4" />
                450 332-0894
              </Link>
              <ListCounter />
              {/* Admin link on desktop when logged in */}
              {isAdmin && (
                <Link href="/admin" className="hidden lg:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand transition-colors">
                  Administration
                </Link>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Desktop user button */}
              <div className="hidden lg:block">
                <UserButton />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md border-t animate-fade-in">
            {/* Mobile Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-500 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            {/* Mobile Navigation Items */}
            <div className="p-4 space-y-2">
           

              {/* Mobile Categories */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                  Catégories
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {mainCategories.slice(0, 8).map((category) => (
                    <Link
                      key={category._id}
                      href={`/?categoryId=${category._id}`}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-brand rounded-lg transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin Section */}
              {adminItems.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                    Administration
                  </div>
                  <div className="space-y-1">
                    {adminItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-brand rounded-lg transition-colors"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Contact */}
              <div className="pt-4 border-t space-y-2">
                <a
                  href="tel:4503320894"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  450 332-0894
                </a>
                <a
                  href="https://spectre-entertainment.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Site principal
                </a>
              </div>

              {/* Mobile User Actions */}
              <div className="pt-4 border-t">
                <UserButton />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}