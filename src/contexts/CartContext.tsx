
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  additionalImages?: string[];
  additional_images?: string[];
  specifications?: { name: string; value: string }[];
  category: string;
  category_id?: string;
  categoryName?: string;
  subcategory?: string;
  subcategoryName?: string;
  terceraCategoria?: string;
  tercera_categoria?: string;
  terceraCategoriaName?: string;
  stock: number;
  cost?: number | string;
  isOffer?: boolean;
  is_offer?: boolean;
  discount?: number;
  originalPrice?: number;
  original_price?: number;
  benefits?: string[];
  warranties?: string[];
  paymentMethods?: string[];
  payment_methods?: string[];
  colors?: { name: string; hexCode: string; image: string }[];
  isPublished?: boolean;
  is_published?: boolean;
  filter_groups?: string[];
  filterGroups?: string[];
  filter_options?: any;
  filterOptions?: any;
  brand?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: { name: string; hexCode: string; image: string };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: { name: string; hexCode: string; image: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const loadCartFromStorage = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializar desde localStorage para que no se sobrescriba con [] al guardar
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1, selectedColor?: { name: string; hexCode: string; image: string }) => {
    setItems(prevItems => {
      // If there's a selected color, we need to check if that specific product+color combination exists
      if (selectedColor) {
        const existingItemWithColor = prevItems.find(
          item => item.id === product.id &&
            item.selectedColor?.name === selectedColor.name
        );

        if (existingItemWithColor) {
          // If the same product with same color exists, update quantity
          return prevItems.map(item =>
            item.id === product.id && item.selectedColor?.name === selectedColor.name
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item with the selected color
          return [...prevItems, { ...product, quantity, selectedColor }];
        }
      } else {
        // Handle products without color selection (original behavior)
        const existingItem = prevItems.find(
          item => item.id === product.id && !item.selectedColor
        );

        if (existingItem) {
          return prevItems.map(item =>
            item.id === product.id && !item.selectedColor
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevItems, { ...product, quantity }];
        }
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
