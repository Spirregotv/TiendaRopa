import React, { createContext, useContext, useState, useMemo } from 'react';
import { APP_CONFIG, PRODUCT_IMAGES } from '../constants/Config';

const InventoryContext = createContext();

const INITIAL_ITEMS = [
  {
    id: '1',
    nombre: 'Blazer Oversize',
    marca: 'MAISON Studio',
    descripcion: 'Blazer oversized de corte relajado con solapa cruzada. Confeccionado en tela premium con forro interior satinado.',
    talla: 'M',
    tallasDisponibles: ['S', 'M', 'L', 'XL'],
    stock: 8,
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
    talla: 'S',
    tallasDisponibles: ['XS', 'S', 'M', 'L'],
    stock: 2,
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
    talla: 'L',
    tallasDisponibles: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 12,
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
    talla: 'M',
    tallasDisponibles: ['XS', 'S', 'M', 'L'],
    stock: 1,
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
    talla: 'L',
    tallasDisponibles: ['M', 'L', 'XL'],
    stock: 5,
    costoAdquisicion: 780,
    precioVenta: 2200,
    categoria: 'hombre',
    gender: 'hombre',
    imageUrl: PRODUCT_IMAGES.abrigo[0],
    gallery: PRODUCT_IMAGES.abrigo,
    bestseller: true,
  },
];

export function InventoryProvider({ children }) {
  const [items, setItems] = useState(INITIAL_ITEMS);
  // Auth state: null = not authenticated, 'admin' or 'client'
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  // Cart state
  const [cart, setCart] = useState([]);

  // Keep backward compatibility
  const isAdmin = userRole === 'admin';

  // --- Auth functions ---
  const loginAsAdmin = () => {
    setUserRole('admin');
    setUserName('Administrador');
    setUserEmail('admin@fashionflow.com');
  };

  const loginAsClient = (name, email) => {
    setUserRole('client');
    setUserName(name || email.split('@')[0]);
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

  // --- Inventory CRUD ---
  const addItem = (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      stock: Number(item.stock),
      costoAdquisicion: Number(item.costoAdquisicion),
      precioVenta: Number(item.precioVenta),
      categoria: item.gender || item.categoria || 'mujer',
      gender: item.gender || 'mujer',
      imageUrl: item.imageUrl || PRODUCT_IMAGES.blazer[0],
      gallery: item.gallery || [PRODUCT_IMAGES.blazer[0]],
      tallasDisponibles: item.tallasDisponibles || [item.talla || 'M'],
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const updateItem = (id, updates) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Deduct stock for each item in a confirmed order
  const deductStock = (orderItems) => {
    setItems((prev) =>
      prev.map((item) => {
        const ordered = orderItems.find((o) => o.id === item.id);
        if (!ordered) return item;
        return { ...item, stock: Math.max(0, item.stock - ordered.quantity) };
      })
    );
  };

  // --- Cart functions ---
  const addToCart = (itemId) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === itemId);
      if (existing) {
        return prev.map((c) =>
          c.itemId === itemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { itemId, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.itemId === itemId ? { ...c, quantity } : c))
    );
  };

  const clearCart = () => setCart([]);

  // --- Financial computations (admin only) ---
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
    };
  }, [items]);

  // --- Cart computations ---
  const cartDetails = useMemo(() => {
    const cartItems = cart.map((c) => {
      const item = items.find((i) => i.id === c.itemId);
      return item ? { ...item, quantity: c.quantity } : null;
    }).filter(Boolean);

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
