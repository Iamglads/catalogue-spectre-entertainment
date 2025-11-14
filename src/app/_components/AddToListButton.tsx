"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { addOrUpdateItem, removeItem, loadList } from '@/lib/listStorage';

type AddToListButtonProps = {
  productId: string;
  productName: string;
  productImage?: string;
  productDescription?: string;
  className?: string;
  variant?: 'default' | 'compact';
  onAdd?: () => void; // Callback appelé quand un item est ajouté
};

export default function AddToListButton({ 
  productId, 
  productName, 
  productImage, 
  productDescription,
  className = '',
  variant = 'default',
  onAdd
}: AddToListButtonProps) {
  const [isSelected, setIsSelected] = useState(false);

  // Synchroniser avec le localStorage
  useEffect(() => {
    const list = loadList();
    setIsSelected(list.some(item => item.id === productId));
  }, [productId]);

  // Écouter les changements dans d'autres onglets
  useEffect(() => {
    const handleStorageChange = () => {
      const list = loadList();
      setIsSelected(list.some(item => item.id === productId));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [productId]);

  const toggleSelect = () => {
    if (isSelected) {
      removeItem(productId);
      setIsSelected(false);
    } else {
      addOrUpdateItem({
        id: productId,
        name: productName,
        image: productImage,
        shortDescription: productDescription
      }, 1);
      setIsSelected(true);
      // Appeler le callback si fourni
      if (onAdd) {
        onAdd();
      }
    }
  };

  if (variant === 'compact') {
    return (
      <button
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${className}`}
        onClick={toggleSelect}
        aria-label={isSelected ? 'Retirer de la liste' : 'Ajouter à la liste'}
      >
        <Heart 
          strokeWidth={1.5} 
          fill={isSelected ? 'currentColor' : 'none'} 
          className={`h-5 w-5 transition-colors ${isSelected ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} 
        />
                        <span className={`text-sm transition-colors ${isSelected ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                          {isSelected ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
                        </span>
      </button>
    );
  }

  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors border cursor-pointer ${isSelected ? 'border-red-200 bg-red-50' : 'border-gray-200'} ${className}`}
      onClick={toggleSelect}
      aria-label={isSelected ? 'Retirer de la liste' : 'Ajouter à la liste'}
    >
      <Heart 
        strokeWidth={1.5} 
        fill={isSelected ? 'currentColor' : 'none'} 
        className={`h-5 w-5 transition-colors ${isSelected ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} 
      />
      <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-red-500' : 'text-gray-700'}`}>
        {isSelected ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
      </span>
    </button>
  );
}

