import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Portal, Dialog, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { COLORS, SPACING, RADIUS, ORDER_STATUSES, STATUS_CONFIG } from '../../config/theme';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingOverlay from '../../components/common/LoadingOverlay';

// ─── Flujo de transición de estados ──────────────────────────────────────────
const NEXT_STATUS = {
  Pendiente: ['Pago Recibido'],
  'Pago Recibido': ['Preparando'],
  Preparando: ['Enviado'],
  Enviado: [],
};

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────
function OrderCard({ order, onChangeStatus }) {
  const date = order.createdAt?.toDate?.() ?? new Date();
  const dateStr = date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const nextOptions = NEXT_STATUS[order.status] ?? [];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{dateStr}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Info del cliente */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="account-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{order.customerName ?? 'Cliente desconocido'}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="email-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{order.customerEmail ?? '—'}</Text>
      </View>

      {/* Items del pedido */}
      <View style={styles.divider} />
      <Text style={styles.itemsTitle}>
        {(order.items ?? []).length} artículo(s)
      </Text>
      {(order.items ?? []).map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            • {item.name}
          </Text>
          <Text style={styles.itemQty}>x{item.quantity}</Text>
          <Text style={styles.itemPrice}>
            ${(item.price * item.quantity).toLocaleString('es-CO')}
          </Text>
        </View>
      ))}

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${order.total?.toLocaleString('es-CO') ?? '0'}</Text>
      </View>

      {/* Botones de acción */}
      {nextOptions.length > 0 && (
        <View style={styles.actionsRow}>
          {nextOptions.map((next) => (
            <TouchableOpacity
              key={next}
              style={[styles.actionBtn, { backgroundColor: STATUS_CONFIG[next]?.bg }]}
              onPress={() => onChangeStatus(order, next)}
            >
              <MaterialCommunityIcons
                name={STATUS_CONFIG[next]?.icon ?? 'arrow-right'}
                size={15}
                color={STATUS_CONFIG[next]?.text}
              />
              <Text style={[styles.actionBtnText, { color: STATUS_CONFIG[next]?.text }]}>
                Marcar: {next}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {order.status === 'Enviado' && (
        <View style={styles.completedBanner}>
          <MaterialCommunityIcons name="check-all" size={15} color={COLORS.success} />
          <Text style={styles.completedText}>Pedido completado</Text>
        </View>
      )}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Listener en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(data);
    });
    return unsub;
  }, []);

  // Filtrar al cambiar lista o filtro activo
  useEffect(() => {
    if (activeFilter === 'Todos') {
      setFiltered(orders);
    } else {
      setFiltered(orders.filter((o) => o.status === activeFilter));
    }
  }, [orders, activeFilter]);

  // ─── Lógica de inventario ──────────────────────────────────────────────────
  // Se ejecuta en una transacción cuando el estado pasa a "Pago Recibido"
  const deductStock = async (order) => {
    const items = order.items ?? [];
    if (items.length === 0) return;

    await runTransaction(db, async (tx) => {
      // Leer todos los productos de la orden primero
      const productRefs = items.map((item) => doc(db, 'products', item.productId));
      const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

      // Validar stock suficiente
      productSnaps.forEach((snap, i) => {
        const currentStock = snap.data()?.stock ?? 0;
        const required = items[i].quantity;
        if (currentStock < required) {
          throw new Error(
            `Stock insuficiente para "${items[i].name}". Disponible: ${currentStock}, Requerido: ${required}`
          );
        }
      });

      // Descontar stock
      productSnaps.forEach((snap, i) => {
        const newStock = (snap.data()?.stock ?? 0) - items[i].quantity;
        tx.update(productRefs[i], { stock: newStock });
      });

      // Marcar orden con stock descontado
      tx.update(doc(db, 'orders', order.id), {
        status: 'Pago Recibido',
        stockDeducted: true,
        updatedAt: serverTimestamp(),
      });
    });
  };

  // ─── Cambiar estado del pedido ────────────────────────────────────────────
  const handleChangeStatus = useCallback(async (order, newStatus) => {
    Alert.alert(
      'Confirmar cambio',
      `¿Cambiar el pedido a "${newStatus}"?${
        newStatus === 'Pago Recibido'
          ? '\n\nEsto descontará el inventario automáticamente.'
          : ''
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            setLoadingMsg(
              newStatus === 'Pago Recibido'
                ? 'Confirmando pago y actualizando inventario...'
                : 'Actualizando estado...'
            );
            setLoading(true);
            try {
              if (newStatus === 'Pago Recibido' && !order.stockDeducted) {
                // Usa transacción con descuento de inventario
                await deductStock(order);
              } else {
                // Actualización simple de estado
                await updateDoc(doc(db, 'orders', order.id), {
                  status: newStatus,
                  updatedAt: serverTimestamp(),
                });
              }
            } catch (e) {
              Alert.alert('Error', e.message ?? 'No se pudo actualizar el pedido.');
            } finally {
              setLoading(false);
              setLoadingMsg('');
            }
          },
        },
      ]
    );
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={styles.root}>
      <LoadingOverlay visible={loading} message={loadingMsg} />

      {/* Filtros */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Todos', ...ORDER_STATUSES]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item)}
            >
              {item !== 'Todos' && (
                <View
                  style={[
                    styles.chipDot,
                    {
                      backgroundColor:
                        activeFilter === item
                          ? '#fff'
                          : STATUS_CONFIG[item]?.dot ?? COLORS.textMuted,
                    },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Contador */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onChangeStatus={handleChangeStatus} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="inbox-outline" size={52} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin pedidos</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'Todos'
                ? 'Aún no hay pedidos registrados.'
                : `No hay pedidos con estado "${activeFilter}".`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  filterBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: '#fff' },
  chipDot: { width: 7, height: 7, borderRadius: 4 },

  countRow: { paddingHorizontal: SPACING.md, paddingVertical: 8 },
  countText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 32 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  orderDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  infoText: { fontSize: 13, color: COLORS.textSecondary },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },

  itemsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 4,
  },
  itemName: { flex: 1, fontSize: 13, color: COLORS.text },
  itemQty: { fontSize: 13, color: COLORS.textSecondary, width: 28 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary },

  actionsRow: { marginTop: SPACING.sm, gap: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    padding: 8,
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  completedText: { fontSize: 13, fontWeight: '600', color: COLORS.success },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
