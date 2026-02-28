import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from './CartContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/supabase';
import { toast } from '@/hooks/use-toast';

interface FavoritesContextType {
    favorites: Product[];
    toggleFavorite: (product: Product) => Promise<void>;
    isFavorite: (productId: string) => boolean;
    loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Load favorites from localStorage on mount (for guest users or as fallback)
    useEffect(() => {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            try {
                setFavorites(JSON.parse(savedFavorites));
            } catch (e) {
                console.error("Error parsing favorites from localStorage", e);
            }
        }
    }, []);

    // Sync with Supabase when user changes
    useEffect(() => {
        const fetchSupabaseFavorites = async () => {
            if (!user) {
                // If user logs out, keep local favorites or clear?
                // Let's keep them for now
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('product_id, products(*)')
                    .eq('user_id', user.id);

                if (error) {
                    if (error.code === 'PGRST116') {
                        // Table might not exist yet, fallback to localStorage
                        console.log("Favorites table might not exist, using localStorage");
                    } else {
                        console.error("Error fetching favorites:", error);
                    }
                } else if (data) {
                    const fetchedFavorites = data
                        .map((f: any) => f.products)
                        .filter(Boolean);
                    setFavorites(fetchedFavorites);
                    localStorage.setItem('favorites', JSON.stringify(fetchedFavorites));
                }
            } catch (e) {
                console.error("Error in fetchSupabaseFavorites", e);
            } finally {
                setLoading(false);
            }
        };

        fetchSupabaseFavorites();
    }, [user]);

    const toggleFavorite = async (product: Product) => {
        const isFav = favorites.some(f => f.id === product.id);
        let newFavorites: Product[];

        if (isFav) {
            newFavorites = favorites.filter(f => f.id !== product.id);
            if (user) {
                try {
                    await supabase
                        .from('favorites')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('product_id', product.id);
                } catch (e) {
                    console.error("Error deleting favorite from Supabase", e);
                }
            }
            toast({
                title: "Eliminado",
                description: `${product.name} se quitó de favoritos`,
                duration: 2000,
            });
        } else {
            newFavorites = [...favorites, product];
            if (user) {
                try {
                    // Check if table exists by trying to insert
                    const { error } = await supabase
                        .from('favorites')
                        .insert({ user_id: user.id, product_id: product.id });

                    if (error) console.error("Error adding favorite to Supabase", error);
                } catch (e) {
                    console.error("Error adding favorite to Supabase", e);
                }
            }
            toast({
                title: "Agregado",
                description: `${product.name} se agregó a favoritos`,
                duration: 2000,
            });
        }

        setFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
    };

    const isFavorite = (productId: string) => {
        return favorites.some(f => f.id === productId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
            {children}
        </FavoritesContext.Provider>
    );
};
