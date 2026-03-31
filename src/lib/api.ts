import { Product } from '@/contexts/CartContext';
import { parseFormattedPrice } from './utils';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

// Configuración de timeouts por defecto
const DEFAULT_TIMEOUT = 25000;
const UPLOAD_TIMEOUT = 60000;

/**
 * Función centralizada para peticiones fetch con timeout y abort signal.
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = DEFAULT_TIMEOUT } = options;

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);

    // Inyectar token de autenticación automáticamente si existe
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timerId);
        return response;
    } catch (error: any) {
        clearTimeout(timerId);
        if (error.name === 'AbortError') {
            throw new Error(`La conexión con el servidor superó el tiempo límite (${timeout / 1000}s).`);
        }
        throw error;
    }
}

/**
 * Fetch de productos
 */
export const fetchProducts = async (options: {
    limit?: number,
    offset?: number,
    category_id?: string,
    category_name?: string,
    search?: string,
    sort?: string,
    order?: 'asc' | 'desc'
} = {}): Promise<{ products: Product[], total: number }> => {
    const {
        limit = 24,
        offset = 0,
        category_id,
        category_name,
        search,
        sort = 'updated_at',
        order = 'desc'
    } = options;

    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit.toString());
        queryParams.append('offset', offset.toString());
        if (category_id) queryParams.append('category_id', category_id);
        if (category_name) queryParams.append('category_name', category_name);
        if (search) queryParams.append('search', search);
        queryParams.append('sort', sort);
        queryParams.append('order', order);

        const url = `${API_BASE_URL}/products?${queryParams.toString()}`;
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) throw new Error('Error al cargar productos');
        
        const result = await response.json();
        const mappedProducts = (result.products || []).map((p: any) => ({
            ...p,
            price: parseFormattedPrice(p.price),
            originalPrice: p.original_price ? parseFormattedPrice(p.original_price) : undefined,
            additionalImages: p.additional_images || []
        }));

        return { products: mappedProducts, total: result.total || 0 };
    } catch (error: any) {
        console.error('Error in fetchProducts:', error.message);
        return { products: [], total: 0 };
    }
};

/**
 * Fetch de producto por slug
 */
export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products/${slug}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return {
            ...data,
            price: parseFormattedPrice(data.price),
            additionalImages: data.additional_images || []
        };
    } catch (error: any) {
        console.error('Error in fetchProductBySlug:', error.message);
        return null;
    }
};

/**
 * Fetch de categorías
 */
export const fetchCategories = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Error al cargar categorías');
        return await response.json();
    } catch (error: any) {
        console.error('Error in fetchCategories:', error.message);
        return [];
    }
};

/**
 * Crear orden (Solo Backend)
 */
export const createOrder = async (orderData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Error al procesar el pedido');
    }
    return await response.json();
};

/**
 * Métodos de Administrador (Standard CRUD vs NestJs API)
 */
export const fetchAdminProducts = async (limit = 100, offset = 0): Promise<{ products: Product[], total: number }> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/admin/all?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('No se pudieron cargar los productos');
    const result = await response.json();
    return {
        products: result.products.map((p: any) => ({
            ...p,
            additionalImages: p.additional_images || []
        })),
        total: result.total || 0
    };
};

export const createProduct = async (productData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Error al crear producto');
    return await response.json();
};

export const updateProduct = async (id: string, productData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Error al actualizar producto');
    return await response.json();
};

export const deleteProduct = async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar producto');
    return await response.json();
};

export const uploadFile = async (file: File, folder: string = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetchWithTimeout(`${API_BASE_URL}/storage/upload`, {
        method: 'POST',
        timeout: UPLOAD_TIMEOUT,
        body: formData,
    });

    if (!response.ok) throw new Error('Error al subir archivo');
    return await response.json();
};

export const fetchCompanyProfile = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/company`);
        return response.ok ? await response.json() : null;
    } catch { return null; }
};

export const updateCompanyProfile = async (profileData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error('Error al actualizar perfil');
    return await response.json();
};

export const fetchInfoSections = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/info`);
        return response.ok ? await response.json() : [];
    } catch { return []; }
};

export const updateInfoSection = async (sectionData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
    });
    if (!response.ok) throw new Error('Error al actualizar sección');
    return await response.json();
};

export async function fetchOrderStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/orders/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return { todaySales: 0, monthlySales: 0 };
  }
}

export const fetchOrders = async (userId?: string) => {
    try {
        const url = userId ? `${API_BASE_URL}/orders?userId=${userId}` : `${API_BASE_URL}/orders`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error('Error al cargar pedidos');
        return await response.json();
    } catch { return []; }
};
