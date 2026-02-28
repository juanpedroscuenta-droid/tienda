import { Product } from '@/contexts/CartContext';
import { auth } from '@/firebase';

const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || `http://${hostname}:3001/api`;

const getAuthToken = async () => {
    try {
        const { data } = await auth.getSession();
        console.log("Token from getSession():", !!data?.session?.access_token);
        return data?.session?.access_token || '';
    } catch {
        console.log("Error getting token");
        return '';
    }
};

import { parseFormattedPrice } from './utils';

// Variables de caché para mejorar rendimiento en tienda
let storeProductsCache: Product[] | null = null;
let storeProductsTimestamp: number | null = null;
const STORE_CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

export const clearStoreCache = () => {
    storeProductsCache = null;
    storeProductsTimestamp = null;
    storeCategoriesCache = null;
    storeCategoriesTimestamp = null;
};

/**
 * Función para obtener todos los productos desde nuestro nuevo backend Node.js
 */
export const fetchProducts = async (forceRefresh = false): Promise<Product[]> => {
    try {
        if (!forceRefresh && storeProductsCache && storeProductsTimestamp) {
            const isValid = (Date.now() - storeProductsTimestamp) < STORE_CACHE_DURATION;
            if (isValid) {
                return storeProductsCache;
            }
        }

        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();

        const mappedProducts = data.map((p: any) => ({
            ...p,
            price: parseFormattedPrice(p.price),
            originalPrice: p.original_price ? parseFormattedPrice(p.original_price) : (p.originalPrice ? parseFormattedPrice(p.originalPrice) : undefined)
        }));

        storeProductsCache = mappedProducts;
        storeProductsTimestamp = Date.now();
        return mappedProducts;
    } catch (error) {
        console.error('Error in fetchProducts:', error);
        return storeProductsCache || []; // Retorna caché obsoleta si falla o array vacío
    }
};

/**
 * Función para obtener los detalles de un producto específico
 */
export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${slug}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Error al obtener el producto');
        }
        return await response.json();
    } catch (error) {
        console.error('Error in fetchProductBySlug:', error);
        return null;
    }
};

let storeCategoriesCache: any[] | null = null;
let storeCategoriesTimestamp: number | null = null;

/**
 * Función para obtener categorías
 */
export const fetchCategories = async (forceRefresh = false) => {
    try {
        if (!forceRefresh && storeCategoriesCache && storeCategoriesTimestamp) {
            const isValid = (Date.now() - storeCategoriesTimestamp) < STORE_CACHE_DURATION;
            if (isValid) {
                return storeCategoriesCache;
            }
        }

        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Error al obtener categorías');
        const data = await response.json();

        storeCategoriesCache = data;
        storeCategoriesTimestamp = Date.now();
        return data;
    } catch (error) {
        console.error('Error in fetchCategories:', error);
        return storeCategoriesCache || [];
    }
};

/**
 * Función genérica para enviar órdenes al backend
 */
export const createOrder = async (orderData: any) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Error al crear la orden');
        return await response.json();
    } catch (error) {
        console.error('Error in createOrder:', error);
        throw error;
    }
};

// --- API METHODS FOR ADMIN PANEL ---

export const fetchAdminProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/admin/all`);
        if (!response.ok) throw new Error('Error al obtener todos los productos');
        return await response.json();
    } catch (error) {
        console.error('Error in fetchAdminProducts:', error);
        return [];
    }
}

export const fetchProductById = async (id: string): Promise<Product | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/admin/${id}`);
        if (!response.ok) throw new Error('Error al obtener el producto');
        return await response.json();
    } catch (error) {
        console.error('Error in fetchProductById:', error);
        return null;
    }
}

export const createProduct = async (productData: any) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error('Error al crear producto');
        return await response.json();
    } catch (error) {
        console.error('Error in createProduct:', error);
        throw error;
    }
}

export const updateProduct = async (id: string, productData: any) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error('Error al actualizar producto');
        return await response.json();
    } catch (error) {
        console.error('Error in updateProduct:', error);
        throw error;
    }
}

export const deleteProduct = async (id: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar producto');
        return await response.json();
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        throw error;
    }
}

export const fetchOrders = async (userId?: string) => {
    try {
        const token = await getAuthToken();
        const url = userId ? `${API_BASE_URL}/orders?userId=${userId}` : `${API_BASE_URL}/orders`;
        const response = await fetch(url, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) throw new Error('Error al obtener órdenes');
        return await response.json();
    } catch (error) {
        console.error('Error in fetchOrders:', error);
        return [];
    }
}

export const updateOrder = async (id: string, updates: any) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al actualizar orden');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Error in updateOrder:', error);
        throw error;
    }
}

export const deleteOrder = async (id: string) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
            method: 'DELETE',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al eliminar orden');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Error in deleteOrder:', error);
        throw error;
    }
}

export const fetchOrderStats = async () => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/orders/stats`, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) throw new Error('Error al obtener estadísticas de órdenes');
        return await response.json();
    } catch (error) {
        console.error('Error in fetchOrderStats:', error);
        return { todaySales: 0, monthlySales: 0, count: 0 };
    }
}

/**
 * Empresa y Configuración
 */
export const fetchCompanyProfile = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/company`);
        if (!response.ok) throw new Error('Error al obtener perfil de empresa');
        return await response.json();
    } catch (error) {
        console.error('Error in fetchCompanyProfile:', error);
        return null;
    }
}

export const updateCompanyProfile = async (profileData: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}/company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
        });
        if (!response.ok) throw new Error('Error al actualizar perfil de empresa');
        return await response.json();
    } catch (error) {
        console.error('Error in updateCompanyProfile:', error);
        throw error;
    }
}

/**
 * Secciones de Información (Ayuda Rápida)
 */
export const fetchInfoSections = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/info`);
        if (!response.ok) throw new Error('Error al obtener secciones de información');
        return await response.json();
    } catch (error) {
        console.error('Error in fetchInfoSections:', error);
        return [];
    }
}

export const updateInfoSection = async (sectionData: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sectionData),
        });
        if (!response.ok) throw new Error('Error al actualizar sección de información');
        return await response.json();
    } catch (error) {
        console.error('Error in updateInfoSection:', error);
        throw error;
    }
}
/**
 * Almacenamiento (Storage)
 */
export const uploadFile = async (file: File, folder: string = 'general') => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch(`${API_BASE_URL}/storage/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Error al subir archivo');
        return await response.json();
    } catch (error) {
        console.error('Error in uploadFile:', error);
        throw error;
    }
}

export const deleteFile = async (path: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/storage/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path }),
        });

        if (!response.ok) throw new Error('Error al eliminar archivo');
        return await response.json();
    } catch (error) {
        console.error('Error in deleteFile:', error);
        throw error;
    }
}
