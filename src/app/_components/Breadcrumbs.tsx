"use client";
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type BreadcrumbItem = {
  label: string;
  href?: string;
  active?: boolean;
};

type Category = {
  _id: string;
  name: string;
  fullPath: string;
  parentId: string | null;
};

export default function Breadcrumbs() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const categoryId = searchParams.get('categoryId');
  const searchQuery = searchParams.get('q');

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.items || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Accueil', href: '/' }
    ];

    if (categoryId && categories.length > 0) {
      const category = categories.find(cat => cat._id === categoryId);
      if (category) {
        // Build category path
        const pathParts = category.fullPath.split('/');
        let currentPath = '';
        
        pathParts.forEach((part, index) => {
          currentPath += (index > 0 ? '/' : '') + part;
          const cat = categories.find(c => c.fullPath === currentPath);
          if (cat) {
            items.push({
              label: cat.name,
              href: index === pathParts.length - 1 ? undefined : `/?categoryId=${cat._id}`,
              active: index === pathParts.length - 1
            });
          }
        });
      }
    }

    // Remove search crumb to avoid duplication in header
    // if (searchQuery) {
    //   items.push({
    //     label: `Recherche: "${searchQuery}"`,
    //     active: true
    //   });
    // }

    setBreadcrumbs(items);
  }, [categoryId, searchQuery, categories]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="py-4">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-brand transition-colors"
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                {item.label}
              </Link>
            ) : (
              <span className={`${item.active ? 'text-brand font-medium' : 'text-gray-900'}`}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}