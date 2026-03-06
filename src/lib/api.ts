import { Product } from '@/contexts/CartContext';
import { auth } from '@/firebase';
import { supabase } from '@/supabase';
import { parseFormattedPrice } from './utils';
import { toast } from '@/hooks/use-toast';

const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || `http://${hostname}:3001/api`;

// Configuración de timeouts por defecto
const DEFAULT_TIMEOUT = 20000; // 20 segundos para evitar colgaduras infinitas
const UPLOAD_TIMEOUT = 60000;  // 60 segundos para subidas pesadas

/**
 * Función centralizada para peticiones fetch con timeout y abort signal.
 * Esto evita que la interfaz se "cuelgue" si el backend no responde.
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = DEFAULT_TIMEOUT } = options;

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timerId);
        return response;
    } catch (error: any) {
        clearTimeout(timerId);
        if (error.name === 'AbortError') {
            throw new Error(`La conexión con el servidor superó el tiempo límite (${timeout / 1000}s). Por favor reintente.`);
        }
        throw error;
    }
}

const getAuthToken = async () => {
    try {
        const { data } = await auth.getSession();
        return data?.session?.access_token || '';
    } catch {
        return '';
    }
};

// --- CACHE DE PRODUCTOS ---
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
 * Fetch de productos con manejo de errores mejorado y timeout
 */
export const fetchProducts = async (forceRefresh = false): Promise<Product[]> => {
    try {
        if (!forceRefresh && storeProductsCache && storeProductsTimestamp) {
            const isValid = (Date.now() - storeProductsTimestamp) < STORE_CACHE_DURATION;
            if (isValid) return storeProductsCache;
        }

        const response = await fetchWithTimeout(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Servidor de productos no disponible');
        const data = await response.json();

        const mappedProducts = data.map((p: any) => ({
            ...p,
            price: parseFormattedPrice(p.price),
            originalPrice: p.original_price ? parseFormattedPrice(p.original_price) : (p.originalPrice ? parseFormattedPrice(p.originalPrice) : undefined),
            additionalImages: p.additional_images || p.additionalImages || []
        }));

        storeProductsCache = mappedProducts;
        storeProductsTimestamp = Date.now();
        return mappedProducts;
    } catch (error: any) {
        console.error('Error fetching Products:', error.message);
        return storeProductsCache || [];
    }
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products/${slug}`, { timeout: 10000 });
        if (!response.ok) return null;
        const data = await response.json();
        return {
            ...data,
            additionalImages: data.additional_images || data.additionalImages || []
        };
    } catch (error: any) {
        console.error('Error fetching Product by Slug:', error.message);
        return null;
    }
};

let storeCategoriesCache: any[] | null = null;
let storeCategoriesTimestamp: number | null = null;

export const fetchCategories = async (forceRefresh = false) => {
    try {
        if (!forceRefresh && storeCategoriesCache && storeCategoriesTimestamp) {
            const isValid = (Date.now() - storeCategoriesTimestamp) < STORE_CACHE_DURATION;
            if (isValid) return storeCategoriesCache;
        }

        const response = await fetchWithTimeout(`${API_BASE_URL}/categories`, { timeout: 10000 });
        if (!response.ok) return [];
        const data = await response.json();

        storeCategoriesCache = data;
        storeCategoriesTimestamp = Date.now();
        return data;
    } catch (error: any) {
        console.error('Error fetching Categories:', error.message);
        return storeCategoriesCache || [];
    }
};

/**
 * Órdenes con Fallback Automático a Supabase.
 * Esta es la pieza clave para la estabilidad: si el backend Node.js falla, 
 * el sistema guarda directamente en la base de datos para no perder la venta.
 */
export const createOrder = async (orderData: any) => {
    try {
        const token = await getAuthToken();
        const response = await fetchWithTimeout(`${API_BASE_URL}/orders`, {
            method: 'POST',
            timeout: 25000, // Dar más tiempo a las órdenes
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Backend Error');
        return await response.json();
    } catch (error: any) {
        console.warn('Backend falló, usando guardado directo en Supabase...', error.message);

        try {
            const { items, user_id, coupon_code } = orderData;
            const payload = {
                user_id: user_id || null,
                user_name: orderData.user_name || orderData.userName || null,
                user_email: orderData.user_email || orderData.userEmail || null,
                user_phone: orderData.user_phone || orderData.userPhone || null,
                items: items,
                total: Number(orderData.total),
                delivery_fee: Number(orderData.delivery_fee || 0),
                order_notes: orderData.order_notes || orderData.orderNotes || null,
                status: orderData.status || 'pending',
                order_type: orderData.order_type || 'online',
                payment_method: orderData.payment_method || orderData.paymentMethod || null,
                discount_type: orderData.discount_type || orderData.discountType || 'none',
                discount_value: Number(orderData.discount_value || 0),
                coupon_code: coupon_code ? coupon_code.trim().toUpperCase() : null,
                created_at: new Date().toISOString()
            };

            const { data: order, error: insertError } = await supabase
                .from('orders')
                .insert([payload])
                .select();

            if (insertError) throw insertError;
            return order?.[0] || payload;
        } catch (supabaseError: any) {
            console.error('Error crítico: Supabase tampoco respondió:', supabaseError.message);
            throw new Error("No se pudo conectar con los servidores de base de datos.");
        }
    }
};

// --- ADMIN PANEL METHODS ---

export const fetchAdminProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products/admin/all`, { timeout: 30000 });
        if (!response.ok) throw new Error('Server unreachable');
        const data = await response.json();
        return data.map((p: any) => ({
            ...p,
            additionalImages: p.additional_images || p.additionalImages || []
        }));
    } catch (error: any) {
        console.error('fetchAdminProducts error:', error.message);
        toast({
            title: "Error de servidor",
            description: "No se pudo conectar con el catálogo. Reintentando...",
            variant: "destructive"
        });
        return [];
    }
}

export const fetchProductById = async (id: string): Promise<Product | null> => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products/admin/${id}`, { timeout: 15000 });
        if (!response.ok) return null;
        const data = await response.json();
        return {
            ...data,
            additionalImages: data.additional_images || data.additionalImages || []
        };
    } catch (error: any) {
        return null;
    }
}

export const createProduct = async (productData: any) => {
    const token = await getAuthToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {
        method: 'POST',
        timeout: 25000,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Error al guardar el nuevo producto');
    return await response.json();
}

export const updateProduct = async (id: string, productData: any) => {
    const token = await getAuthToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        timeout: 25000,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Error al actualizar el producto');
    return await response.json();
}

export const fetchOrders = async (userId?: string) => {
    try {
        const token = await getAuthToken();
        const url = userId ? `${API_BASE_URL}/orders?userId=${userId}` : `${API_BASE_URL}/orders`;
        const response = await fetchWithTimeout(url, {
            timeout: 30000,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) throw new Error('Error backend orders');
        return await response.json();
    } catch (error: any) {
        console.error('fetchOrders failed:', error.message);
        return [];
    }
}

export const updateOrder = async (id: string, updates: any) => {
    const token = await getAuthToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
        method: 'PUT',
        timeout: 20000,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('No se pudo actualizar el pedido');
    return await response.json();
}

export const deleteOrder = async (id: string) => {
    const token = await getAuthToken();
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE',
        timeout: 15000,
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (!response.ok) throw new Error('No se pudo eliminar el pedido');
    return await response.json();
}

export const fetchOrderStats = async () => {
    try {
        const token = await getAuthToken();
        const response = await fetchWithTimeout(`${API_BASE_URL}/orders/stats`, {
            timeout: 15000,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) return { todaySales: 0, monthlySales: 0, count: 0 };
        return await response.json();
    } catch (error: any) {
        return { todaySales: 0, monthlySales: 0, count: 0 };
    }
}

// --- COMPANY & INFO ---

// --- USER ADDRESSES ---

export const addUserAddress = async (userId: string, addressData: any) => {
    try {
        const { data, error } = await supabase
            .from('user_addresses')
            .insert([{
                user_id: userId,
                name: addressData.name || 'Principal (Bot)',
                address: addressData.address,
                city: addressData.city || '',
                province: addressData.province || '',
                postal_code: addressData.postalCode || '',
                is_default: addressData.isDefault || false
            }])
            .select();

        if (error) throw error;
        return data?.[0];
    } catch (error: any) {
        console.error('addUserAddress failed:', error.message);
        throw error;
    }
}

export const fetchCompanyProfile = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/company`, { timeout: 10000 });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

export const updateCompanyProfile = async (profileData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/company`, {
        method: 'POST',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error('Error perfil empresa');
    return await response.json();
}

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
}

export const deleteFile = async (path: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/storage/delete`, {
        method: 'POST',
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    });
    if (!response.ok) throw new Error('Error al eliminar archivo');
    return await response.json();
}

// --- COUPONS ---

export const fetchCoupons = async () => {
    try {
        const token = await getAuthToken();
        const response = await fetchWithTimeout(`${API_BASE_URL}/coupons`, {
            timeout: 15000,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
        return await response.json();
    } catch (error: any) {
        console.error('fetchCoupons failed:', error.message);
        return [];
    }
}

export const validateCouponByCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', cleanCode)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        if (!data) return { valid: false, message: 'Cupón no encontrado' };

        const now = new Date();
        if (data.valid_from && new Date(data.valid_from) > now) return { valid: false, message: 'Cupón no válido aún' };
        if (data.valid_until && new Date(data.valid_until) < now) return { valid: false, message: 'Cupón expirado' };
        if (data.usage_limit && data.usage_count >= data.usage_limit) return { valid: false, message: 'Límite alcanzado' };

        return { valid: true, coupon: data };
    } catch (error: any) {
        return { valid: false, message: 'Error de conexión' };
    }
}

export const markCouponAsUsed = async (couponId: string, userId: string | null = null, userName: string | null = null, userEmail: string | null = null) => {
    try {
        const { data: coupon } = await supabase.from('coupons').select('usage_count').eq('id', couponId).maybeSingle();
        if (coupon) {
            await supabase.from('coupons').update({ usage_count: (coupon.usage_count || 0) + 1 }).eq('id', couponId);
            await supabase.from('coupon_usage').insert([{
                coupon_id: couponId,
                user_id: userId,
                user_name: userName || 'Cliente (En proceso)',
                user_email: userEmail,
            }]);
        }
    } catch (e: any) {
        console.error('markCouponAsUsed failed');
    }
}

export const createCouponsBulk = async (coupons: any[]) => {
    try {
        const { data, error } = await supabase.from('coupons').insert(coupons).select();
        if (error) throw error;
        return data;
    } catch (error: any) {
        console.error('createCouponsBulk failed:', error.message);
        throw error;
    }
}

export const updateCoupon = async (id: string, updates: any) => {
    try {
        const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select();
        if (error) throw error;
        return data;
    } catch (error: any) {
        console.error('updateCoupon failed:', error.message);
        throw error;
    }
}

export const deleteCoupon = async (id: string) => {
    try {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error: any) {
        console.error('deleteCoupon failed:', error.message);
        throw error;
    }
}

export const fetchCouponUsage = async (couponId: string) => {
    try {
        const { data, error } = await supabase
            .from('coupon_usage')
            .select('*')
            .eq('coupon_id', couponId)
            .order('used_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error: any) {
        console.error('fetchCouponUsage failed:', error.message);
        return [];
    }
}

// --- INFO SECTIONS ---

export const fetchInfoSections = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/info`, { timeout: 10000 });
        if (!response.ok) return [];
        return await response.json();
    } catch (error: any) {
        console.error('fetchInfoSections failed:', error.message);
        return [];
    }
}

export const updateInfoSection = async (sectionData: any) => {
    try {
        const token = await getAuthToken();
        const response = await fetchWithTimeout(`${API_BASE_URL}/info`, {
            method: 'POST',
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(sectionData),
        });
        if (!response.ok) throw new Error('Error al actualizar sección');
        return await response.json();
    } catch (error: any) {
        console.error('updateInfoSection failed:', error.message);
        throw error;
    }
}
export const fetchChatBotSettings = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/chatbot`, { timeout: 10000 });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

export const updateChatBotSettings = async (settingsData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
    });
    if (!response.ok) throw new Error('Error guardando configuración del bot');
    return await response.json();
}
