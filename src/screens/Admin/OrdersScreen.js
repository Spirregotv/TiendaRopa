import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useOrders, STATUS_COLORS } from '../../context/OrdersContext';
import OrderCard from '../../components/OrderCard';

const FILTER_CHIPS = [
  'Todos',
  'Pendiente de Pago',
  'Pago Recibido',
  'En Preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
];

export default function OrdersScreen() {
  const { orders, orderStats } = useOrders();
  const [filterStatus, setFilterStatus] = useState('Todos');

  const filtered = useMemo(() => {
    if (filterStatus === 'Todos') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pedidos Entrantes</Text>
          <Text style={styles.subtitle}>
            {orderStats.totalOrders} total · {orderStats.pendingCount} pendiente
            {orderStats.pendingCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {orderStats.pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{orderStats.pendingCount}</Text>
          </View>
        )}
      </View>

      {/* ── Stats row ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatChip label="Confirmados" value={orderStats.receivedCount} color="#067D62" />
        <StatChip label="Preparando" value={orderStats.preparingCount} color="#7B61FF" />
        <StatChip label="Enviados" value={orderStats.shippedCount} color="#007185" />
        <StatChip label="Entregados" value={orderStats.deliveredCount} color={Colors.success} />
        <StatChip
          label="Ingresos"
          value={`$${orderStats.totalRevenue.toFixed(0)}`}
          color={Colors.accent}
          isAmount
        />
      </ScrollView>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = filterStatus === chip;
          const color =
            chip === 'Todos' ? Colors.primary : STATUS_COLORS[chip] ?? Colors.primary;
          return (
            <TouchableOpacity
              key={chip}
              style={[
                styles.chip,
                { borderColor: color },
                isActive && { backgroundColor: color },
              ]}
              onPress={() => setFilterStatus(chip)}
            >
              <Text style={[styles.chipText, { color: isActive ? '#fff' : color }]}>
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Orders list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.orderId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={52} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Sin pedidos</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'Todos'
                ? 'Los pedidos de los clientes aparecerán aquí'
                : `No hay pedidos en "${filterStatus}"`}
            </Text>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </SafeAreaView>
  );
}

function StatChip({ label, value, color, isAmount }) {
  return (
    <View style={[styles.statChip, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  statChip: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
    marginRight: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    gap: 8,
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
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
