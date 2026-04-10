import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { APP_CONFIG } from '../../constants/Config';
import { useOrders } from '../../context/OrdersContext';

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Pendiente de Pago': {
    color: Colors.warning,
    bg: Colors.warningLight,
    icon: 'time-outline',
    step: 0,
  },
  'Confirmado': {
    color: '#007185',
    bg: '#E8F8F8',
    icon: 'checkmark-circle-outline',
    step: 1,
  },
  'En Preparación': {
    color: '#6B4CE6',
    bg: '#F0EBFF',
    icon: 'construct-outline',
    step: 2,
  },
  'Enviado': {
    color: '#2196F3',
    bg: '#E3F2FD',
    icon: 'airplane-outline',
    step: 3,
  },
  'Entregado': {
    color: Colors.success,
    bg: Colors.successLight,
    icon: 'checkmark-done-outline',
    step: 4,
  },
  'Cancelado': {
    color: Colors.danger,
    bg: Colors.dangerLight,
    icon: 'close-circle-outline',
    step: -1,
  },
};

const TIMELINE_STEPS = ['Confirmado', 'Preparando', 'Enviado', 'Entregado'];

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Confirmado'];
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }]}>{status}</Text>
    </View>
  );
};

// ─── Progress Timeline ──────────────────────────────────────────────────────
const ShippingTimeline = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Confirmado'];
  const currentStep = config.step;

  if (currentStep < 0) return null; // Cancelado — no mostrar timeline

  return (
    <View style={styles.timeline}>
      {TIMELINE_STEPS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const dotColor = isCompleted || isCurrent ? config.color : Colors.border;

        return (
          <View key={label} style={styles.timelineStep}>
            {/* Connecting line */}
            {i > 0 && (
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: isCompleted ? config.color : Colors.border },
                ]}
              />
            )}
            {/* Step dot */}
            <View style={[styles.timelineDot, { backgroundColor: dotColor }]}>
              {isCompleted && (
                <Ionicons name="checkmark" size={10} color="#FFF" />
              )}
              {isCurrent && !isCompleted && (
                <View style={styles.timelineDotInner} />
              )}
            </View>
            <Text
              style={[
                styles.timelineLabel,
                (isCompleted || isCurrent) && { color: config.color, fontWeight: '600' },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Order Card ─────────────────────────────────────────────────────────────
const OrderCard = ({ order }) => {
  const date = new Date(order.date);
  const formattedDate = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.orderCard}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <Text style={styles.orderDate}>
            {formattedDate} · {formattedTime}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {order.items.map((item, idx) => (
          <View key={`${item.id}-${idx}`} style={styles.itemRow}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.nombre}
              </Text>
              <View style={styles.itemMeta}>
                {item.talla && (
                  <Text style={styles.itemSize}>Talla {item.talla}</Text>
                )}
                <Text style={styles.itemQty}>× {item.quantity}</Text>
              </View>
            </View>
            <Text style={styles.itemPrice}>
              {APP_CONFIG.currency}
              {(item.precioVenta * item.quantity).toLocaleString('es-MX')}
            </Text>
          </View>
        ))}
      </View>

      {/* Shipping Timeline */}
      <ShippingTimeline status={order.status} />

      {/* Footer */}
      <View style={styles.orderFooter}>
        <View style={styles.paymentInfo}>
          <Ionicons
            name={order.paymentMethod.includes('Oxxo') ? 'cash-outline' : 'card-outline'}
            size={16}
            color={Colors.textSecondary}
          />
          <Text style={styles.paymentText}>{order.paymentMethod}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            {APP_CONFIG.currency}
            {order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Oxxo reference if applicable */}
      {order.paymentRef && (
        <View style={styles.refBanner}>
          <Ionicons name="receipt-outline" size={14} color="#8B6914" />
          <Text style={styles.refText}>
            Ref. Oxxo: <Text style={{ fontWeight: '700' }}>{order.paymentRef}</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function MyOrders({ navigation }) {
  const { orders } = useOrders();

  // Empty state
  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={48} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
          <Text style={styles.emptySubtitle}>
            Cuando realices tu primera compra, podrás ver el estado de tus pedidos aquí.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('ProfileOverview')}
          >
            <Ionicons name="storefront-outline" size={18} color="#FFF" />
            <Text style={styles.shopBtnText}>Ir a la tienda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Summary header */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.length}</Text>
          <Text style={styles.summaryLabel}>
            Pedido{orders.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {orders.filter((o) => o.status === 'Entregado').length}
          </Text>
          <Text style={styles.summaryLabel}>Entregados</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: Colors.warning }]}>
            {orders.filter((o) => o.status === 'Pendiente de Pago').length}
          </Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order) => (
          <OrderCard key={order.orderId} order={order} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 30, backgroundColor: Colors.border },

  scrollContent: { padding: 16, paddingBottom: 30 },

  // Order card
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  orderDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Items
  itemsContainer: { padding: 12, gap: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  itemMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  itemSize: { fontSize: 12, color: Colors.textSecondary },
  itemQty: { fontSize: 12, color: Colors.textLight },
  itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  // Timeline
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceAlt,
  },
  timelineStep: { alignItems: 'center', flex: 1, position: 'relative' },
  timelineLine: {
    position: 'absolute',
    top: 9,
    right: '50%',
    width: '100%',
    height: 2,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  timelineLabel: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentText: { fontSize: 12, color: Colors.textSecondary },
  totalBox: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 10, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },

  // Oxxo ref
  refBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0A0',
  },
  refText: { fontSize: 12, color: '#8B6914' },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  shopBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
