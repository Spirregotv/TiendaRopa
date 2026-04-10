import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { APP_CONFIG } from '../constants/Config';

/**
 * ─── ESTRUCTURA DE BASE DE DATOS ───────────────────────────────────────────
 *
 * Colección: 'pedidos'
 * {
 *   orderId:       string,          // "MAS-123456-789"
 *   userId:        string,          // email del cliente
 *   status:        string,          // "Pendiente de Pago" | "Pago Recibido" | ...
 *   items: [{
 *     id:          string,          // referencia al producto en inventario
 *     nombre:      string,
 *     talla:       string,
 *     precioVenta: number,
 *     imageUrl:    string,
 *     quantity:    number,
 *   }],
 *   total:         number,
 *   subtotal:      number,
 *   shippingCost:  number,
 *   paymentMethod: string,
 *   paymentRef:    string | null,
 *   address:       { calle, numero, codigoPostal, ciudad },
 *   date:          ISO string,
 * }
 *
 * Colección: 'productos'
 * {
 *   id:                string,
 *   nombre:            string,
 *   stock:             number,      ← campo clave para la transacción
 *   precioVenta:       number,
 *   costoAdquisicion:  number,
 *   categoria:         string,
 *   tallasDisponibles: string[],
 *   imageUrl:          string,
 * }
 *
 * ── Con Firebase se reemplazaría useState por onSnapshot: ───────────────────
 * useEffect(() => {
 *   const q = query(collection(db, 'pedidos'), orderBy('date', 'desc'));
 *   const unsubscribe = onSnapshot(q, (snap) => {
 *     setOrders(snap.docs.map(d => ({ orderId: d.id, ...d.data() })));
 *   });
 *   return () => unsubscribe();
 * }, []);
 * ───────────────────────────────────────────────────────────────────────────
 */

const OrdersContext = createContext();

function generateReference() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}

function generateOrderId() {
  const prefix = 'MAS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// ─── Status lifecycle ────────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  'Pendiente de Pago',
  'Pago Recibido',
  'En Preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
];

export const STATUS_COLORS = {
  'Pendiente de Pago': '#FF9900',
  'Pago Recibido':     '#067D62',
  'En Preparación':    '#7B61FF',
  'Enviado':           '#007185',
  'Entregado':         '#43A047',
  'Cancelado':         '#E53935',
  'Confirmado':        '#067D62', // legacy compat
};

export const OXXO_ACCOUNT = '638180000112626198';

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);

  // Place a new order from cart
  const placeOrder = ({ items, total, subtotal, shippingCost, paymentMethod, address, userId }) => {
    const newOrder = {
      orderId:       generateOrderId(),
      userId:        userId || 'anonymous',
      items: items.map((item) => ({
        id:          item.id,
        nombre:      item.nombre,
        talla:       item.talla,
        precioVenta: item.precioVenta,
        imageUrl:    item.imageUrl,
        quantity:    item.quantity,
      })),
      status:        paymentMethod === 'card' ? 'Pago Recibido' : 'Pendiente de Pago',
      total,
      subtotal,
      shippingCost,
      paymentMethod: paymentMethod === 'card' ? 'Tarjeta de Crédito/Débito' : 'Efectivo - Oxxo',
      paymentRef:    paymentMethod === 'cash' ? generateReference() : null,
      address:       { ...address },
      date:          new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  // Admin: update order status
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
    );
  };

  /**
   * confirmarPago — Transacción atómica de inventario
   *
   * 1. Valida que haya stock suficiente para TODOS los productos del pedido
   *    antes de mutar cualquier dato (validación pre-commit).
   * 2. Si alguno falla, lanza un Error descriptivo y no modifica nada.
   * 3. Si pasa la validación, descuenta el stock y cambia el estado.
   *
   * @param {string}   pedidoId      - ID del pedido a confirmar
   * @param {Array}    inventoryItems - Lista actual de productos (de InventoryContext)
   * @param {Function} deductStockFn  - Función deductStock de InventoryContext
   * @throws {Error} si el stock es insuficiente o el pedido no existe
   */
  const confirmarPago = useCallback(
    async (pedidoId, inventoryItems, deductStockFn) => {
      // Buscar el pedido
      const pedido = orders.find((o) => o.orderId === pedidoId);
      if (!pedido) throw new Error('Pedido no encontrado.');
      if (pedido.status !== 'Pendiente de Pago') {
        throw new Error('Este pedido ya fue procesado anteriormente.');
      }

      // ── Fase 1: Validación completa antes de cualquier mutación ──────────
      const problemas = [];
      for (const orderItem of pedido.items) {
        const producto = inventoryItems.find((p) => p.id === orderItem.id);
        if (!producto) {
          problemas.push(`"${orderItem.nombre}" ya no existe en inventario.`);
        } else if (producto.stock < orderItem.quantity) {
          problemas.push(
            `"${orderItem.nombre}": necesitas ${orderItem.quantity} unidad(es), ` +
              `solo hay ${producto.stock} en stock.`
          );
        }
      }

      if (problemas.length > 0) {
        throw new Error(`Stock insuficiente:\n\n${problemas.join('\n')}`);
      }

      // ── Fase 2: Commit — descontar stock y cambiar estado ────────────────
      deductStockFn(pedido.items);
      updateOrderStatus(pedidoId, 'Pago Recibido');
    },
    [orders]
  );

  // Filter orders by userId (for client profile)
  const getOrdersByUser = (userId) => orders.filter((o) => o.userId === userId);

  // Computed stats for admin dashboard
  const orderStats = useMemo(() => {
    const byStatus = (s) => orders.filter((o) => o.status === s);
    const pending   = byStatus('Pendiente de Pago');
    const received  = orders.filter((o) => o.status === 'Pago Recibido' || o.status === 'Confirmado');
    const preparing = byStatus('En Preparación');
    const shipped   = byStatus('Enviado');
    const delivered = byStatus('Entregado');
    const cancelled = byStatus('Cancelado');

    const totalRevenue = orders
      .filter((o) => !['Cancelado', 'Pendiente de Pago'].includes(o.status))
      .reduce((s, o) => s + o.total, 0);

    return {
      totalOrders:    orders.length,
      pendingCount:   pending.length,
      receivedCount:  received.length,
      preparingCount: preparing.length,
      shippedCount:   shipped.length,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      pendingTotal:   pending.reduce((s, o) => s + o.total, 0),
      confirmedTotal: received.reduce((s, o) => s + o.total, 0),
      totalRevenue,
      pendingOrders:   pending,
      confirmedOrders: received,
    };
  }, [orders]);

  return (
    <OrdersContext.Provider
      value={{ orders, orderStats, placeOrder, updateOrderStatus, getOrdersByUser, confirmarPago }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within an OrdersProvider');
  return ctx;
}

export default OrdersContext;
