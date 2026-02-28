import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  type: 'low_stock' | 'out_of_stock';
  stock: number;
  timestamp: Date;
  read: boolean;
}

const STOCK_LOW_THRESHOLD = 5; // Notificar cuando stock < 5
const STORAGE_KEY = 'stock-notifications';
const MAX_NOTIFICATIONS = 50;

// Generar ID consistente basado en productId y tipo
const generateNotificationId = (productId: string, type: 'low_stock' | 'out_of_stock') => {
  return `stock_${productId}_${type}`;
};

// Función para guardar notificaciones en localStorage
const saveNotificationsToStorage = (notifications: StockNotification[]) => {
  try {
    const serialized = notifications.map(n => ({
      ...n,
      timestamp: n.timestamp.toISOString()
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Error guardando notificaciones en localStorage:', error);
  }
};

// Función para cargar notificaciones desde localStorage
const loadNotificationsFromStorage = (): StockNotification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
  } catch (error) {
    console.error('Error cargando notificaciones desde localStorage:', error);
  }
  return [];
};

export const useStockNotifications = () => {
  const isSupabase = typeof (db as any)?.from === 'function';
  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousStockRef = useRef<Map<string, number>>(new Map());
  const notificationIdCounter = useRef(0);
  const isInitialized = useRef(false);

  // Cargar notificaciones guardadas al inicio
  useEffect(() => {
    if (!isInitialized.current) {
      const stored = loadNotificationsFromStorage();
      if (stored.length > 0) {
        setNotifications(stored);
        isInitialized.current = true;
      }
    }
  }, []);

  // Guardar notificaciones en localStorage cada vez que cambien (evitar guardar durante carga inicial)
  useEffect(() => {
    if (isInitialized.current) {
      saveNotificationsToStorage(notifications);
    }
  }, [notifications]);

  useEffect(() => {
    if (isSupabase) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    // OPTIMIZACIÓN: Usar debouncing y procesamiento eficiente para mejorar rendimiento
    let processingTimeout: NodeJS.Timeout | null = null;
    let batchChanges: Array<{productId: string, product: any}> = [];
    
    const processBatch = () => {
      if (batchChanges.length === 0) return;
      
      const newNotifications: StockNotification[] = [];
      const currentStocks = new Map<string, number>();
      
      // Procesar cambios en batch
      batchChanges.forEach(({ productId, product }) => {
        let stock = product.stock;
        if (stock === undefined || stock === null) {
          stock = product.quantity || product.cantidad || 0;
        }
        stock = Number(stock) || 0;
        currentStocks.set(productId, stock);
        
        const previousStock = previousStockRef.current.get(productId);
        
        // Solo procesar si el stock es bajo/agotado o cambió significativamente
        if (stock === 0 || stock < STOCK_LOW_THRESHOLD || 
            (previousStock !== undefined && previousStock !== stock && 
             (previousStock === 0 || previousStock < STOCK_LOW_THRESHOLD || stock === 0 || stock < STOCK_LOW_THRESHOLD))) {
          
          if (previousStock !== undefined && previousStock !== stock) {
            if (stock === 0 && previousStock > 0) {
              newNotifications.push({
                id: generateNotificationId(productId, 'out_of_stock'),
                productId,
                productName: product.name || 'Producto sin nombre',
                type: 'out_of_stock',
                stock: 0,
                timestamp: new Date(),
                read: false,
              });
            } else if (stock > 0 && stock < STOCK_LOW_THRESHOLD && previousStock >= STOCK_LOW_THRESHOLD) {
              newNotifications.push({
                id: generateNotificationId(productId, 'low_stock'),
                productId,
                productName: product.name || 'Producto sin nombre',
                type: 'low_stock',
                stock,
                timestamp: new Date(),
                read: false,
              });
            }
          }
        }
        
        previousStockRef.current.set(productId, stock);
      });
      
      batchChanges = [];
      
      // Actualizar notificaciones si hay nuevas
      if (newNotifications.length > 0) {
        setNotifications((prev) => {
          const existingMap = new Map(prev.map(n => [n.id, n]));
          const processedNew = newNotifications.map(newNotif => {
            const existing = existingMap.get(newNotif.id);
            if (existing) {
              return {
                ...existing,
                stock: newNotif.stock,
                timestamp: existing.read ? existing.timestamp : new Date(),
              };
            }
            return newNotif;
          });
          
          const newIds = new Set(processedNew.map(n => n.id));
          const combined = [
            ...processedNew,
            ...prev.filter(n => !newIds.has(n.id))
          ];
          
          return combined.slice(0, MAX_NOTIFICATIONS);
        });
      }
    };
    
    const productsQuery = query(collection(db, 'products'));
    const isInitialLoad = previousStockRef.current.size === 0;
    
    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        // En carga inicial, procesar todos los productos una vez
        if (isInitialLoad) {
          const newNotifications: StockNotification[] = [];
          const currentStocks = new Map<string, number>();

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            let stock = data.stock;
            if (stock === undefined || stock === null) {
              stock = data.quantity || data.cantidad || 0;
            }
            stock = Number(stock) || 0;
            currentStocks.set(doc.id, stock);
            
            // Solo generar notificaciones para productos con stock bajo o agotado
            if (stock === 0 || stock < STOCK_LOW_THRESHOLD) {
              const productId = doc.id;
              const productName = data.name || 'Producto sin nombre';
              
              if (stock === 0) {
                newNotifications.push({
                  id: generateNotificationId(productId, 'out_of_stock'),
                  productId,
                  productName,
                  type: 'out_of_stock',
                  stock: 0,
                  timestamp: new Date(),
                  read: false,
                });
              } else {
                newNotifications.push({
                  id: generateNotificationId(productId, 'low_stock'),
                  productId,
                  productName,
                  type: 'low_stock',
                  stock,
                  timestamp: new Date(),
                  read: false,
                });
              }
            }
          });
          
          previousStockRef.current = new Map(currentStocks);
          
          // Procesar notificaciones iniciales
          if (newNotifications.length > 0) {
            const stored = loadNotificationsFromStorage();
            const existingMap = new Map(stored.map(n => [n.id, n]));
            
            const processedNew = newNotifications.map(newNotif => {
              const existing = existingMap.get(newNotif.id);
              if (existing) {
                return {
                  ...existing,
                  stock: newNotif.stock,
                  timestamp: existing.read ? existing.timestamp : new Date(),
                };
              }
              return newNotif;
            });
            
            const newIds = new Set(processedNew.map(n => n.id));
            const combined = [
              ...processedNew,
              ...stored.filter(n => !newIds.has(n.id))
            ];
            
            setNotifications(combined.slice(0, MAX_NOTIFICATIONS));
          } else {
            const stored = loadNotificationsFromStorage();
            if (stored.length > 0) {
              setNotifications(stored.slice(0, MAX_NOTIFICATIONS));
            }
          }
          isInitialized.current = true;
        } else {
          // Después de la carga inicial, usar debouncing para procesar cambios
          snapshot.docChanges().forEach((change) => {
            batchChanges.push({
              productId: change.doc.id,
              product: change.doc.data()
            });
          });
          
          // Limpiar timeout anterior
          if (processingTimeout) {
            clearTimeout(processingTimeout);
          }
          
          // Procesar cambios después de 500ms de inactividad (debouncing)
          processingTimeout = setTimeout(processBatch, 500);
        }
      },
      (error) => {
        console.error('Error listening to products:', error);
      }
    );

    return () => {
      unsubscribe();
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, []);

  // Actualizar contador de no leídas
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== notificationId);
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};

