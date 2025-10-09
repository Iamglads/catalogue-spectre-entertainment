"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import CategorySelect from './CategorySelect';
import { Menu, X, Search, Phone, ExternalLink, ChevronDown, Grid3X3, Heart, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ListCounter from './ListCounter';
// Theme toggle removed; default to light theme
import UserButton from '../user-button';
import SpiderWeb from './SpiderWeb';
import { useTheme } from '@/contexts/ThemeContext';

type Category = {
  _id: string;
  name: string;
  fullPath: string;
  depth: number;
  parentId: string | null;
  label?: string;
};

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  const { theme, currentTheme } = useTheme();

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
    { href: '/admin/settings', label: 'Paramètres' },
  ] : [];

  return (
    <>
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-500 relative overflow-hidden"
        style={{
          background: currentTheme === 'halloween' 
            ? theme.colors.headerBg 
            : 'rgba(255, 255, 255, 0.8)',
          borderColor: 'var(--theme-border, rgb(229, 231, 235, 0.5))',
          boxShadow: currentTheme === 'halloween' 
            ? '0 4px 20px rgba(255, 107, 53, 0.3)' 
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Spider web effect for Halloween */}
        <SpiderWeb />
        
        {/* Halloween fog effect */}
        {currentTheme === 'halloween' && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(106, 5, 114, 0.3) 0%, transparent 60%)',
            }}
          />
        )}
        
        <div className="w-full relative z-20">
          {/* Single-line header: logo + contacts + actions */}
          <div className="flex max-w-7xl mx-auto items-center justify-between h-16 px-4 sm:px-6 lg:px-8 gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group relative">
              <div
                className="px-3 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: currentTheme === 'halloween' ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                  backdropFilter: currentTheme === 'halloween' ? 'blur(10px)' : 'none',
                  border: currentTheme === 'halloween' ? '1px solid rgba(255, 107, 53, 0.3)' : 'none',
                }}
              >
                <Image 
                  src="/Logo.png" 
                  alt="Spectre Entertainment" 
                  width={100} 
                  height={40} 
                  className="h-6 w-auto transition-all group-hover:scale-105"
                  style={{
                    filter: currentTheme === 'halloween' 
                      ? 'brightness(0) invert(1) drop-shadow(0 0 15px rgba(255, 107, 53, 0.8))' 
                      : 'none',
                  }}
                />
              </div>
            </Link>


            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              <Link
                href="https://spectre-entertainment.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
                style={{
                  borderColor: 'var(--theme-border, #e5e7eb)',
                  backgroundColor: currentTheme === 'halloween' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: currentTheme === 'halloween' ? '#ffffff' : 'var(--theme-text, #1f2937)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme === 'halloween' ? 'rgba(255, 255, 255, 0.15)' : 'rgb(249, 250, 251)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme === 'halloween' ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
                }}
              >
                <ExternalLink className="h-4 w-4" style={{ color: currentTheme === 'halloween' ? '#FFB627' : 'var(--theme-text, #374151)' }} />
                <span>Site principal</span>
              </Link>
              <Link 
                href="tel:4503320894" 
                className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-white transition-all duration-200"
                style={{
                  backgroundColor: 'var(--theme-primary, #3b82f6)',
                  boxShadow: 'var(--theme-button-shadow, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
                  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover, #2563eb)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-primary, #3b82f6)';
                }}
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">450 332-0894</span>
              </Link>
              <ListCounter />
              {/* Admin link on desktop when logged in */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="hidden lg:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: 'var(--theme-border, #e5e7eb)',
                    color: 'var(--theme-text, #374151)',
                  }}
                >
                  Administration
                </Link>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
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
           

              {/* Mobile Categories (unified with desktop filter) */}
              <div className="pt-2 px-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-2">
                  Catégories
                </div>
                <CategorySelect
                  categories={categories
                    .filter((c) => c.fullPath !== 'decors-a-vendre')
                    .map((c) => ({ _id: c._id, label: c.label || `${'\u2014 '.repeat(c.depth)}${c.name}`, fullPath: c.fullPath }))}
                  value={''}
                  onChange={(id) => { window.location.href = `/?categoryId=${id}`; setMobileMenuOpen(false); }}
                  placeholder="Catégorie…"
                />
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