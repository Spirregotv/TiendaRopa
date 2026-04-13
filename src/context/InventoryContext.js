import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, PRODUCT_IMAGES } from '../constants/Config';

const InventoryContext = createContext();

const INVENTORY_KEY = '@tienda_inventory';

/**
 * ─── ESTRUCTURA DE PRODUCTO ─────────────────────────────────────────────────
 *
 * Cada producto tiene un campo `stockPorTalla` con conteo individual:
 * {
 *   id: string,
 *   nombre: string,
 *   stockPorTalla: { S: 5, M: 10, L: 3, XL: 2 },  ← stock por variante
 *   stock: number,   ← computed: sum(stockPorTalla) — backward compat
 *   agotado: boolean, ← computed: stock === 0
 *   ...
 * }
 *
 * Con Firebase/Supabase se persistiría en:
 *   collection('productos').doc(id).set({ stockPorTalla: { S: 5, M: 10 } })
 * ─────────────────────────────────────────────────────────────────────────────
 */

const INITIAL_ITEMS = [
  {
    id: '1',
    nombre: 'Blazer Oversize',
    marca: 'MAISON Studio',
    descripcion: 'Blazer oversized de corte relajado con solapa cruzada. Confeccionado en tela premium con forro interior satinado.',
    tallasDisponibles: ['S', 'M', 'L', 'XL'],
    stockPorTalla: { S: 2, M: 3, L: 2, XL: 1 },
    costoAdquisicion: 450,
    precioVenta: 1200,
    categoria: 'mujer',
    gender: 'mujer',
    imageUrl: PRODUCT_IMAGES.blazer[0],
    gallery: PRODUCT_IMAGES.blazer,
    bestseller: true,
  },
  {
    id: '2',
    nombre: 'Pantalón Wide Leg',
    marca: 'MAISON Denim',
    descripcion: 'Pantalón de pierna ancha con cintura alta y corte moderno. Tela mezclilla premium con elastano para mayor comodidad.',
    tallasDisponibles: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 0, S: 1, M: 1, L: 0 },
    costoAdquisicion: 280,
    precioVenta: 750,
    categoria: 'mujer',
    gender: 'mujer',
    imageUrl: PRODUCT_IMAGES.pantalon[0],
    gallery: PRODUCT_IMAGES.pantalon,
    bestseller: false,
  },
  {
    id: '3',
    nombre: 'Camisa Lino Premium',
    marca: 'MAISON Homme',
    descripcion: 'Camisa de lino 100% con cuello italiano y botones de nácar. Ideal para climas cálidos y ocasiones semi-formales.',
    tallasDisponibles: ['S', 'M', 'L', 'XL', 'XXL'],
    stockPorTalla: { S: 2, M: 3, L: 4, XL: 2, XXL: 1 },
    costoAdquisicion: 320,
    precioVenta: 890,
    categoria: 'hombre',
    gender: 'hombre',
    imageUrl: PRODUCT_IMAGES.camisa[0],
    gallery: PRODUCT_IMAGES.camisa,
    bestseller: true,
  },
  {
    id: '4',
    nombre: 'Vestido Midi Satén',
    marca: 'MAISON Atelier',
    descripcion: 'Vestido midi en satén de seda con corte al bies. Tirantes ajustables y escote en V. Perfecto para eventos especiales.',
    tallasDisponibles: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 0, S: 0, M: 1, L: 0 },
    costoAdquisicion: 520,
    precioVenta: 1500,
    categoria: 'mujer',
    gender: 'mujer',
    imageUrl: PRODUCT_IMAGES.vestido[0],
    gallery: PRODUCT_IMAGES.vestido,
    bestseller: false,
  },
  {
    id: '5',
    nombre: 'Abrigo Camel',
    marca: 'MAISON Homme',
    descripcion: 'Abrigo largo en mezcla de lana y cachemira. Diseño clásico con doble botonadura y bolsillos laterales con solapa.',
    tallasDisponibles: ['M', 'L', 'XL'],
    stockPorTalla: { M: 1, L: 2, XL: 2 },
    costoAdquisicion: 780,
    precioVenta: 2200,
    categoria: 'hombre',
    gender: 'hombre',
    imageUrl: PRODUCT_IMAGES.abrigo[0],
    gallery: PRODUCT_IMAGES.abrigo,
    bestseller: true,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Calcula stock total desde stockPorTalla (backward compat con stock plano) */
function computeStock(item) {
  if (item.stockPorTalla) {
    return Object.values(item.stockPorTalla).reduce((s, v) => s + v, 0);
  }
  return item.stock || 0;
}

/** Enriquece un item con campos computados: stock, agotado, talla (default) */
function enrichItem(item) {
  const stock = computeStock(item);
  return {
    ...item,
    stock,
    agotado: stock === 0,
    talla: item.talla || item.tallasDisponibles?.[0] || 'M',
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function InventoryProvider({ children }) {
  const [rawItems, setRawItems] = useState(INITIAL_ITEMS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Auth state
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  // Cart state
  const [cart, setCart] = useState([]);

  const isAdmin = userRole === 'admin';

  // ── Persistencia: hidratar inventario de AsyncStorage al montar ──────────
  useEffect(() => {
    (async () => {
      try {
        const storedInventory = await AsyncStorage.getItem(INVENTORY_KEY);
        if (storedInventory) {
          const parsed = JSON.parse(storedInventory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRawItems(parsed);
          }
        }
      } catch (e) {
        console.warn('[Inventory] hydrate error:', e);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // ── Persistencia: guardar cada vez que cambia el inventario ────────────
  const persistItems = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[Inventory] persist error:', e);
    }
  }, []);

  // Items enriquecidos con stock computado y flag agotado
  const items = useMemo(() => rawItems.map(enrichItem), [rawItems]);

  // ── Auth ────────────────────────────────────────────────────────────────

  const loginAsAdmin = () => {
    setUserRole('admin');
    setUserName('Administrador');
    setUserEmail('admin@fashionflow.com');
  };

  const loginAsClient = (name, email) => {
    const resolvedName = name || email.split('@')[0];
    setUserRole('client');
    setUserName(resolvedName);
    setUserEmail(email);
  };

  const registerClient = (name, email) => {
    setUserRole('client');
    setUserName(name);
    setUserEmail(email);
  };

  const logout = () => {
    setUserRole(null);
    setUserName('');
    setUserEmail('');
    setCart([]);
  };

  // ── CRUD ────────────────────────────────────────────────────────────────

  const addItem = useCallback((item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      costoAdquisicion: Number(item.costoAdquisicion),
      precioVenta: Number(item.precioVenta),
      categoria: item.gender || item.categoria || 'mujer',
      gender: item.gender || 'mujer',
      imageUrl: item.imageUrl || PRODUCT_IMAGES.blazer[0],
      gallery: (item.gallery && item.gallery.length > 0) ? item.gallery : [item.imageUrl || PRODUCT_IMAGES.blazer[0]],
      tallasDisponibles: item.tallasDisponibles || ['M'],
      stockPorTalla: item.stockPorTalla || { M: Number(item.stock) || 0 },
    };
    setRawItems((prev) => {
      const updated = [newItem, ...prev];
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  const updateItem = useCallback((id, updates) => {
    setRawItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  const deleteItem = useCallback((id) => {
    setRawItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  /**
   * deductStock — Descuenta stock por talla específica.
   *
   * Cada orderItem debe tener { id, talla, quantity }.
   * Si la talla específica llega a 0, el botón de compra
   * se deshabilita automáticamente (via campo computed `agotado`).
   */
  const deductStock = useCallback((orderItems) => {
    setRawItems((prev) => {
      const updated = prev.map((item) => {
        const ordered = orderItems.find((o) => o.id === item.id);
        if (!ordered) return item;

        if (item.stockPorTalla && ordered.talla) {
          const newStockPorTalla = { ...item.stockPorTalla };
          const current = newStockPorTalla[ordered.talla] || 0;
          newStockPorTalla[ordered.talla] = Math.max(0, current - ordered.quantity);
          return { ...item, stockPorTalla: newStockPorTalla };
        }

        // Fallback: stock plano
        return { ...item, stock: Math.max(0, (item.stock || 0) - ordered.quantity) };
      });
      persistItems(updated);
      return updated;
    });
  }, [persistItems]);

  /**
   * validateStock — Valida stock por talla antes de comprar.
   *
   * Si la talla no tiene stock, retorna problema descriptivo.
   * Si stock total = 0 → ya está marcado como agotado en la UI.
   */
  const validateStock = useCallback((orderItems) => {
    const problems = [];
    for (const orderItem of orderItems) {
      const product = items.find((p) => p.id === orderItem.id);
      if (!product) {
        problems.push(`"${orderItem.nombre || orderItem.id}" ya no existe.`);
        continue;
      }

      if (product.stockPorTalla && orderItem.talla) {
        const available = product.stockPorTalla[orderItem.talla] || 0;
        if (available < (orderItem.quantity || 1)) {
          problems.push(
            `"${product.nombre}" talla ${orderItem.talla}: ` +
              `necesitas ${orderItem.quantity || 1}, solo hay ${available}.`
          );
        }
      } else {
        const available = product.stock || 0;
        if (available < (orderItem.quantity || 1)) {
          problems.push(
            `"${product.nombre}": necesitas ${orderItem.quantity || 1}, ` +
              `solo hay ${available} en stock.`
          );
        }
      }
    }
    return problems.length === 0
      ? { valid: true, problems: [] }
      : { valid: false, problems };
  }, [items]);

  /**
   * getStockForSize — Retorna el stock disponible de una talla específica.
   * Retorna 0 si la talla no existe o está agotada.
   */
  const getStockForSize = useCallback(
    (itemId, talla) => {
      const product = items.find((p) => p.id === itemId);
      if (!product) return 0;
      if (product.stockPorTalla) return product.stockPorTalla[talla] || 0;
      return product.stock || 0;
    },
    [items]
  );

  // ── Cart ────────────────────────────────────────────────────────────────

  const addToCart = (itemId, talla) => {
    setCart((prev) => {
      // Cart key es itemId + talla para manejar misma prenda en distinta talla
      const key = `${itemId}_${talla || 'default'}`;
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) =>
          c.key === key ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { key, itemId, talla: talla || null, quantity: 1 }];
    });
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((c) => c.key !== key));
  };

  const updateCartQuantity = (key, quantity) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.key === key ? { ...c, quantity } : c))
    );
  };

  const clearCart = () => setCart([]);

  // ── Financials ──────────────────────────────────────────────────────────

  const financials = useMemo(() => {
    const inversionTotal = items.reduce(
      (sum, item) => sum + item.stock * item.costoAdquisicion,
      0
    );
    const ventaPotencial = items.reduce(
      (sum, item) => sum + item.stock * item.precioVenta,
      0
    );
    const gananciaProyectada = ventaPotencial - inversionTotal;

    const itemsConMargen = items.map((item) => ({
      ...item,
      margenUtilidad:
        item.precioVenta > 0
          ? ((item.precioVenta - item.costoAdquisicion) / item.precioVenta) * 100
          : 0,
    }));

    const lowStockItems = items.filter(
      (item) => item.stock < APP_CONFIG.lowStockThreshold
    );

    return {
      inversionTotal,
      ventaPotencial,
      gananciaProyectada,
      itemsConMargen,
      lowStockItems,
      totalItems: items.length,
      totalUnidades: items.reduce((sum, item) => sum + item.stock, 0),
      agotados: items.filter((item) => item.agotado).length,
    };
  }, [items]);

  // ── Cart computations ───────────────────────────────────────────────────

  const cartDetails = useMemo(() => {
    const cartItems = cart
      .map((c) => {
        const item = items.find((i) => i.id === c.itemId);
        if (!item) return null;
        return {
          ...item,
          talla: c.talla || item.talla,
          quantity: c.quantity,
          cartKey: c.key,
        };
      })
      .filter(Boolean);

    const cartTotal = cartItems.reduce(
      (sum, item) => sum + item.precioVenta * item.quantity,
      0
    );
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    return { cartItems, cartTotal, cartCount };
  }, [cart, items]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        isAdmin,
        isHydrated,
        userRole,
        userName,
        userEmail,
        financials,
        cart,
        cartDetails,
        addItem,
        updateItem,
        deleteItem,
        deductStock,
        validateStock,
        getStockForSize,
        loginAsAdmin,
        loginAsClient,
        registerClient,
        logout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

export default InventoryContext;
