/**
 * SalesHistoryContext — Colección Histórica de Ventas (Inmutable)
 *
 * Regla de negocio: los pedidos completados (status = "Entregado") se
 * archivan aquí y NO pueden ser eliminados ni modificados. Esto garantiza
 * la trazabilidad financiera y el cumplimiento de la regla de no-borrado.
 *
 * Persistencia: AsyncStorage (equivalente a una colección 'ventas' en
 * Firestore con reglas de seguridad que bloqueen delete y update).
 *
 * Con Firebase sería:
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /ventas/{saleId} {
 *       allow create: if request.auth != null;
 *       allow read:   if request.auth != null;
 *       allow update, delete: if false;   // ← INMUTABLE
 *     }
 *   }
 */
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tienda_sales_history';
const SalesHistoryContext = createContext();

export function SalesHistoryProvider({ children }) {
  const [sales, setSales] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Hydrate: cargar ventas históricas al montar ───────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setSales(JSON.parse(stored));
      } catch (e) {
        console.warn('[SalesHistory] hydrate error:', e);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // ── Persistir ─────────────────────────────────────────────────────────────
  const persist = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[SalesHistory] persist error:', e);
    }
  }, []);

  /**
   * archiveSale — Copia inmutable de un pedido completado.
   *
   * Una vez archivada, la venta no puede ser eliminada ni modificada.
   * Este método es idempotente: si el orderId ya existe, no lo duplica.
   *
   * @param {Object} order    - El objeto pedido completo
   * @param {Array}  products - Lista de productos del inventario (para capturar costos)
   */
  const archiveSale = useCallback(
    (order, products = []) => {
      setSales((prev) => {
        // Idempotencia: no duplicar
        if (prev.some((s) => s.orderId === order.orderId)) return prev;

        // Enriquecer items con costoAdquisicion del inventario actual
        const enrichedItems = order.items.map((item) => {
          const product = products.find((p) => p.id === item.id);
          return {
            ...item,
            costoAdquisicion: product?.costoAdquisicion ?? 0,
          };
        });

        const archived = {
          orderId: order.orderId,
          userId: order.userId,
          items: enrichedItems,
          total: order.total,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          paymentMethod: order.paymentMethod,
          paymentRef: order.paymentRef,
          address: { ...order.address },
          orderDate: order.date,
          archivedAt: new Date().toISOString(),
          _immutable: true,
        };

        const updated = [archived, ...prev];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  // ── Computed sales stats para el módulo de finanzas ────────────────────────
  const salesStats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

    const totalCost = sales.reduce(
      (sum, s) =>
        sum +
        s.items.reduce(
          (itemSum, item) =>
            itemSum + (item.costoAdquisicion || 0) * item.quantity,
          0
        ),
      0
    );

    const totalShipping = sales.reduce(
      (sum, s) => sum + (s.shippingCost || 0),
      0
    );

    // Agrupar por mes
    const byMonth = {};
    sales.forEach((s) => {
      const d = new Date(s.orderDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { revenue: 0, count: 0 };
      byMonth[key].revenue += s.total;
      byMonth[key].count += 1;
    });

    // Top productos vendidos
    const productSales = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            nombre: item.nombre,
            unitsCount: 0,
            revenue: 0,
          };
        }
        productSales[item.id].unitsCount += item.quantity;
        productSales[item.id].revenue += item.precioVenta * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales: sales.length,
      totalRevenue,
      totalCost,
      totalShipping,
      netProfit: totalRevenue - totalCost - totalShipping,
      marginPercent:
        totalRevenue > 0
          ? ((totalRevenue - totalCost) / totalRevenue) * 100
          : 0,
      byMonth,
      topProducts,
    };
  }, [sales]);

  return (
    <SalesHistoryContext.Provider
      value={{ sales, salesStats, archiveSale, isHydrated }}
    >
      {children}
    </SalesHistoryContext.Provider>
  );
}

export function useSalesHistory() {
  const ctx = useContext(SalesHistoryContext);
  if (!ctx)
    throw new Error('useSalesHistory must be used within SalesHistoryProvider');
  return ctx;
}

export default SalesHistoryContext;
