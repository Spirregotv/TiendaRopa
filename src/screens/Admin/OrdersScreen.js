import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { APP_CONFIG } from '../../constants/Config';
import { useOrders, STATUS_COLORS } from '../../context/OrdersContext';
import { useInventory } from '../../context/InventoryContext';

const STATUS_FLOW = [
  'Pendiente de Pago',
  'Pago Recibido',
  'En Preparación',
  'Enviado',
  'Entregado',
];

const FILTER_CHIPS = ['Todos', ...STATUS_FLOW, 'Cancelado'];

export default function OrdersScreen() {
  const { orders, updateOrderStatus } = useOrders();
  const { deductStock } = useInventory();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Todos');

  const filtered = useMemo(() => {
    if (filterStatus === 'Todos') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const handleStatusChange = (order, newStatus) => {
    if (newStatus === order.status) return;

    const stockAlreadyDeducted =
      order.status !== 'Pendiente de Pago' && order.status !== 'Cancelado';

    const doChange = () => {
      updateOrderStatus(order.orderId, newStatus);
      if (newStatus === 'Pago Recibido' && !stockAlreadyDeducted) {
        deductStock(order.items);
      }
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    };

    if (newStatus === 'Pago Recibido' && !stockAlreadyDeducted) {
      Alert.alert(
        'Confirmar Pago',
        '¿Confirmás que recibiste el pago? El stock se descontará automáticamente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: doChange },
        ]
      );
    } else if (newStatus === 'Cancelado') {
      Alert.alert(
        'Cancelar Pedido',
        '¿Estás seguro de cancelar este pedido?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, cancelar', style: 'destructive', onPress: doChange },
        ]
      );
    } else {
      doChange();
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos Entrantes</Text>
        {orders.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{orders.length}</Text>
          </View>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {FILTER_CHIPS.map((chip) => {
          const active = filterStatus === chip;
          const color =
            chip === 'Todos' ? Colors.primary : STATUS_COLORS[chip];
          return (
            <TouchableOpacity
              key={chip}
              style={[
                styles.chip,
                active && { backgroundColor: color, borderColor: color },
                !active && { borderColor: color },
              ]}
              onPress={() => setFilterStatus(chip)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? '#fff' : color },
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders list */}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.orderId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Sin pedidos</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'Todos'
                ? 'Aún no hay pedidos registrados'
                : `No hay pedidos en estado "${filterStatus}"`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] || Colors.textSecondary;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => setSelectedOrder(item)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>{item.orderId}</Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusColor + '18' },
                  ]}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: statusColor }]}
                  />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardUser} numberOfLines={1}>
                {item.userId}
              </Text>

              <View style={styles.cardRow}>
                <Text style={styles.cardMeta}>
                  {item.items.length}{' '}
                  {item.items.length === 1 ? 'producto' : 'productos'}
                </Text>
                <Text style={styles.cardTotal}>
                  {APP_CONFIG.currency}
                  {item.total.toFixed(2)}
                </Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                <View style={styles.detailLink}>
                  <Text style={styles.detailLinkText}>Ver detalle</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={Colors.accent}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Order detail / status modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedOrder?.orderId}</Text>
                <Text style={styles.modalSub}>{formatDate(selectedOrder?.date)}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedOrder(null)}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Change status */}
              <Text style={styles.sectionLabel}>Cambiar Estado</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {STATUS_FLOW.map((s) => {
                  const isActive = selectedOrder?.status === s;
                  const color = STATUS_COLORS[s];
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusBtn,
                        { borderColor: color },
                        isActive && { backgroundColor: color },
                      ]}
                      onPress={() => handleStatusChange(selectedOrder, s)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          { color: isActive ? '#fff' : color },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    { borderColor: Colors.danger },
                    selectedOrder?.status === 'Cancelado' && {
                      backgroundColor: Colors.danger,
                    },
                  ]}
                  onPress={() =>
                    handleStatusChange(selectedOrder, 'Cancelado')
                  }
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      {
                        color:
                          selectedOrder?.status === 'Cancelado'
                            ? '#fff'
                            : Colors.danger,
                      },
                    ]}
                  >
                    Cancelado
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Customer info */}
              <Text style={styles.sectionLabel}>Cliente</Text>
              <View style={styles.infoBox}>
                <Ionicons
                  name="person-circle-outline"
                  size={18}
                  color={Colors.textSecondary}
                />
                <Text style={styles.infoText}>{selectedOrder?.userId}</Text>
              </View>
              {selectedOrder?.address && (
                <View style={styles.infoBox}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    {selectedOrder.address.calle}{' '}
                    {selectedOrder.address.numero},{' '}
                    {selectedOrder.address.ciudad} CP{' '}
                    {selectedOrder.address.codigoPostal}
                  </Text>
                </View>
              )}

              {/* Products */}
              <Text style={styles.sectionLabel}>Productos</Text>
              {selectedOrder?.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImg}
                    />
                  ) : (
                    <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                      <Ionicons
                        name="shirt-outline"
                        size={20}
                        color={Colors.textLight}
                      />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Talla: {item.talla} · x{item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {APP_CONFIG.currency}
                    {(item.precioVenta * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}

              {/* Totals */}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>
                  {APP_CONFIG.currency}
                  {selectedOrder?.subtotal?.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Envío</Text>
                <Text style={styles.totalValue}>
                  {selectedOrder?.shippingCost === 0
                    ? 'Gratis'
                    : `${APP_CONFIG.currency}${selectedOrder?.shippingCost?.toFixed(2)}`}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={styles.totalLabelBold}>Total</Text>
                <Text style={styles.totalValueBold}>
                  {APP_CONFIG.currency}
                  {selectedOrder?.total?.toFixed(2)}
                </Text>
              </View>

              {/* Payment */}
              <View style={styles.paymentBox}>
                <Ionicons
                  name="card-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.paymentText}>
                  {selectedOrder?.paymentMethod}
                  {selectedOrder?.paymentRef
                    ? `  ·  Ref: ${selectedOrder.paymentRef}`
                    : ''}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardUser: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.textLight,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailLinkText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 16,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  itemImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
