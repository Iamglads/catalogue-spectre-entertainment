"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Phone, ExternalLink, ChevronDown, Grid3X3, Heart, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ListCounter from './ListCounter';
import ThemeToggle from '../theme-toggle';
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

  const navigationItems = [
    { href: '/', label: 'Catalogue', icon: Grid3X3, active: pathname === '/' },
    { href: '/liste', label: 'Ma Liste', icon: Heart, active: pathname === '/liste' },
  ];

  const adminItems = isAdmin ? [
    { href: '/admin', label: 'Administration', icon: Settings },
    { href: '/admin/products', label: 'Produits' },
    { href: '/admin/categories', label: 'Catégories' },
    { href: '/admin/quotes', label: 'Soumissions' },
  ] : [];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container-max">
          {/* Top bar - Contact info */}
          <div className="hidden lg:flex items-center justify-between py-2 px-6 text-sm text-gray-600 border-b border-gray-100">
            <div className="flex items-center gap-6">
              <a href="tel:4503320894" className="flex items-center gap-2 hover:text-brand transition-colors">
                <Phone className="h-4 w-4" />
                450 332-0894
              </a>
              <span className="text-gray-400">940 Jean‑Neveu, Longueuil (Québec) J4G 2M1</span>
            </div>
            <a
              href="https://spectre-entertainment.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-brand transition-colors"
            >
              Site principal
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Main navigation */}
          <div className="flex items-center justify-between h-16 px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src="/Logo.png" 
                alt="Spectre Entertainment" 
                width={160} 
                height={40} 
                className="h-8 w-auto transition-transform group-hover:scale-105" 
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    item.active 
                      ? 'bg-brand text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoriesOpen(!categoriesOpen);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-brand transition-all"
                >
                  Catégories
                  <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border shadow-xl z-50 animate-fade-in">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900 mb-2">Parcourir par catégorie</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      {mainCategories.map((category) => {
                        const subCategories = getSubCategories(category._id);
                        return (
                          <div key={category._id} className="mb-2">
                            <Link
                              href={`/?categoryId=${category._id}`}
                              className="block px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              {category.name}
                            </Link>
                            {subCategories.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {subCategories.slice(0, 5).map((sub) => (
                                  <Link
                                    key={sub._id}
                                    href={`/?categoryId=${sub._id}`}
                                    className="block px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand rounded-lg transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                                {subCategories.length > 5 && (
                                  <Link
                                    href={`/?categoryId=${category._id}`}
                                    className="block px-3 py-1.5 text-xs text-brand hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    Voir tous ({subCategories.length})
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Rechercher dans le catalogue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-500 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <ListCounter />
              <ThemeToggle />
              
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
          <div className="lg:hidden bg-white border-t animate-fade-in">
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
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    item.active 
                      ? 'bg-brand text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}

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