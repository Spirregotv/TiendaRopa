import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, STATUS_CONFIG } from '../../config/theme';
import StatusBadge from '../../components/common/StatusBadge';

// ─── Tarjeta de estadística ────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Fila de pedido reciente ───────────────────────────────────────────────
function RecentOrderRow({ order }) {
  const date = order.createdAt?.toDate?.() ?? new Date();
  const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderRowLeft}>
        <Text style={styles.orderNum}>#{order.id?.slice(-6).toUpperCase()}</Text>
        <Text style={styles.orderCustomer}>{order.customerName ?? 'Cliente'}</Text>
      </View>
      <View style={styles.orderRowRight}>
        <StatusBadge status={order.status} size="sm" />
        <Text style={styles.orderTotal}>${order.total?.toLocaleString('es-CO')}</Text>
        <Text style={styles.orderDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Listener en tiempo real para pedidos
  useEffect(() => {
    const ordersRef = collection(db, 'orders');

    // Pedidos recientes (últimos 10)
    const recentQ = query(ordersRef, orderBy('createdAt', 'desc'), limit(10));
    const unsubRecent = onSnapshot(recentQ, (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecentOrders(orders.slice(0, 5));

      const totalOrders = snap.size;
      const pendingOrders = orders.filter((o) => o.status === 'Pendiente').length;

      // Ingresos del día
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayRevenue = orders
        .filter((o) => {
          const created = o.createdAt?.toDate?.() ?? new Date(0);
          return created >= todayStart && o.status !== 'Pendiente';
        })
        .reduce((sum, o) => sum + (o.total ?? 0), 0);

      setStats((prev) => ({ ...prev, totalOrders, pendingOrders, todayRevenue }));
    });

    // Total de productos
    const productsRef = collection(db, 'products');
    const unsubProducts = onSnapshot(productsRef, (snap) => {
      setStats((prev) => ({ ...prev, totalProducts: snap.size }));
    });

    return () => {
      unsubRecent();
      unsubProducts();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Encabezado de bienvenida */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcomeText}>Hola, Admin 👋</Text>
          <Text style={styles.welcomeSub}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Tarjetas de estadísticas */}
      <Text style={styles.sectionTitle}>Resumen General</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="shopping-outline"
          label="Pedidos Totales"
          value={stats.totalOrders}
          color={COLORS.primary}
          bgColor={COLORS.primaryLight}
        />
        <StatCard
          icon="clock-alert-outline"
          label="Pendientes"
          value={stats.pendingOrders}
          color={COLORS.warning}
          bgColor={COLORS.warningLight}
        />
        <StatCard
          icon="hanger"
          label="Productos"
          value={stats.totalProducts}
          color={COLORS.purple}
          bgColor={COLORS.purpleLight}
        />
        <StatCard
          icon="currency-usd"
          label="Ingresos Hoy"
          value={`$${stats.todayRevenue.toLocaleString('es-CO')}`}
          color={COLORS.success}
          bgColor={COLORS.successLight}
        />
      </View>

      {/* Estados de pedidos */}
      <Text style={styles.sectionTitle}>Pedidos por Estado</Text>
      <View style={styles.statusRow}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <View key={status} style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
            <Text style={[styles.statusLabel, { color: cfg.text }]}>{status}</Text>
          </View>
        ))}
      </View>

      {/* Pedidos recientes */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Pedidos Recientes</Text>
      </View>
      <View style={styles.recentCard}>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="inbox-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No hay pedidos aún</Text>
          </View>
        ) : (
          recentOrders.map((order) => (
            <RecentOrderRow key={order.id} order={order} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 32 },

  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  welcomeText: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  welcomeSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600' },

  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderRowLeft: { flex: 1 },
  orderRowRight: { alignItems: 'flex-end', gap: 4 },
  orderNum: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  orderCustomer: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderTotal: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  orderDate: { fontSize: 11, color: COLORS.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
