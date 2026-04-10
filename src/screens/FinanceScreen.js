import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrdersContext';
import { useSalesHistory } from '../context/SalesHistoryContext';
import AdminHeader from '../components/AdminHeader';
import FinanceChart from '../components/FinanceChart';

const fmt = (n) =>
  APP_CONFIG.currency +
  (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

export default function FinanceScreen() {
  const { financials, logout, items: inventoryItems } = useInventory();
  const { orderStats, updateOrderStatus, confirmarPago } = useOrders();
  const { sales, salesStats } = useSalesHistory();
  const { deductStock } = useInventory();

  const handleConfirmOrder = (orderId) => {
    Alert.alert(
      'Confirmar Pago',
      '¿Confirmar que recibiste el pago? El stock se descontará automáticamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await confirmarPago(orderId, inventoryItems, deductStock);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <AdminHeader onLogout={logout} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard Financiero</Text>
          <Text style={styles.subtitle}>
            Inversión, proyección y ventas históricas
          </Text>
        </View>

        <View style={styles.content}>
          {/* ── Balance General ── */}
          <View style={styles.balanceRow}>
            <BalanceCard
              label="Ingresos Confirmados"
              value={fmt(orderStats.totalRevenue)}
              icon="trending-up"
              color={Colors.success}
            />
            <BalanceCard
              label="Ventas Históricas"
              value={fmt(salesStats.totalRevenue)}
              icon="archive"
              color="#007185"
            />
          </View>
          <View style={styles.balanceRow}>
            <BalanceCard
              label="Ganancia Neta"
              value={fmt(salesStats.netProfit)}
              icon="wallet"
              color={salesStats.netProfit >= 0 ? Colors.success : Colors.danger}
            />
            <BalanceCard
              label="Margen Global"
              value={`${salesStats.marginPercent.toFixed(1)}%`}
              icon="pie-chart"
              color={Colors.accent}
            />
          </View>

          {/* ── Ventas Completadas (Historial Inmutable) ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#067D62" />
              <Text style={styles.sectionTitle}>
                Historial de Ventas ({salesStats.totalSales})
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Registro inmutable — los pedidos completados no pueden modificarse
            </Text>

            {sales.length === 0 ? (
              <Text style={styles.noDataText}>
                Aún no hay ventas completadas. Cuando un pedido llegue a
                "Entregado" se archivará aquí automáticamente.
              </Text>
            ) : (
              <>
                {/* Top productos vendidos */}
                {salesStats.topProducts.length > 0 && (
                  <View style={styles.topProducts}>
                    <Text style={styles.miniLabel}>Top Productos</Text>
                    {salesStats.topProducts.map((p, i) => (
                      <View key={i} style={styles.topRow}>
                        <Text style={styles.topRank}>#{i + 1}</Text>
                        <Text style={styles.topName} numberOfLines={1}>
                          {p.nombre}
                        </Text>
                        <Text style={styles.topUnits}>{p.unitsCount} uds</Text>
                        <Text style={styles.topRevenue}>{fmt(p.revenue)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Últimas 5 ventas */}
                <Text style={styles.miniLabel}>Últimas Ventas Archivadas</Text>
                {sales.slice(0, 5).map((sale) => (
                  <View key={sale.orderId} style={styles.saleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.saleId}>#{sale.orderId}</Text>
                      <Text style={styles.saleDate}>
                        {new Date(sale.orderDate).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        · {sale.items.length} productos
                      </Text>
                    </View>
                    <View style={styles.saleAmountBox}>
                      <Text style={styles.saleAmount}>{fmt(sale.total)}</Text>
                      <Ionicons
                        name="lock-closed"
                        size={10}
                        color={Colors.textLight}
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* ── Pending Sales Alert ── */}
          {orderStats.pendingCount > 0 && (
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <View style={styles.pendingIconCircle}>
                  <Ionicons name="time-outline" size={20} color="#8B6914" />
                </View>
                <View style={styles.pendingHeaderInfo}>
                  <Text style={styles.pendingTitle}>
                    {orderStats.pendingCount} Venta
                    {orderStats.pendingCount > 1 ? 's' : ''} Pendiente
                    {orderStats.pendingCount > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.pendingAmount}>
                    Total: {fmt(orderStats.pendingTotal)}
                  </Text>
                </View>
              </View>

              {orderStats.pendingOrders.map((order) => (
                <View key={order.orderId} style={styles.pendingOrderRow}>
                  <View style={styles.pendingOrderInfo}>
                    <Text style={styles.pendingOrderId}>
                      #{order.orderId}
                    </Text>
                    <Text style={styles.pendingOrderMeta}>
                      {order.paymentMethod} ·{' '}
                      {new Date(order.date).toLocaleDateString('es-MX', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.pendingOrderTotal}>
                    {fmt(order.total)}
                  </Text>
                  <TouchableOpacity
                    style={styles.confirmOrderBtn}
                    onPress={() => handleConfirmOrder(order.orderId)}
                  >
                    <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                    <Text style={styles.confirmOrderText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── Confirmed Sales Summary ── */}
          {orderStats.receivedCount > 0 && (
            <View style={styles.confirmedCard}>
              <View style={styles.confirmedLeft}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#067D62"
                />
                <Text style={styles.confirmedTitle}>
                  {orderStats.receivedCount} Venta
                  {orderStats.receivedCount > 1 ? 's' : ''} Confirmada
                  {orderStats.receivedCount > 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.confirmedAmount}>
                {fmt(orderStats.confirmedTotal)}
              </Text>
            </View>
          )}

          <FinanceChart financials={financials} />

          {/* ── Per-item margin table ── */}
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>Margen por Producto</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Producto</Text>
              <Text style={styles.th}>Costo</Text>
              <Text style={styles.th}>Precio</Text>
              <Text style={styles.th}>Margen</Text>
            </View>
            {financials.itemsConMargen.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.td}>
                  {APP_CONFIG.currency}
                  {item.costoAdquisicion}
                </Text>
                <Text style={styles.td}>
                  {APP_CONFIG.currency}
                  {item.precioVenta}
                </Text>
                <Text
                  style={[
                    styles.td,
                    {
                      color:
                        item.margenUtilidad >= 50
                          ? Colors.success
                          : item.margenUtilidad >= 30
                          ? Colors.warning
                          : Colors.danger,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {item.margenUtilidad.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>

          {/* ── Formulas Reference ── */}
          <View style={styles.formulasCard}>
            <Text style={styles.formulasTitle}>Fórmulas Aplicadas</Text>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>Inversión Total</Text>
              <Text style={styles.formulaDesc}>
                Σ (cantidad × costo_adquisición)
              </Text>
            </View>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>Venta Potencial</Text>
              <Text style={styles.formulaDesc}>
                Σ (cantidad × precio_venta)
              </Text>
            </View>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>Margen de Utilidad</Text>
              <Text style={styles.formulaDesc}>
                (precio_venta - costo_adquisición) / precio_venta × 100
              </Text>
            </View>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>Ganancia Neta</Text>
              <Text style={styles.formulaDesc}>
                ingresos_ventas - costo_total - costos_envío
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BalanceCard({ label, value, icon, color }) {
  return (
    <View style={styles.balanceCard}>
      <View style={[styles.balanceIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.balanceValue, { color }]}>{value}</Text>
      <Text style={styles.balanceLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  // Balance cards
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  balanceLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  // Section card
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noDataText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  topProducts: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  topRank: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    width: 24,
  },
  topName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  topUnits: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  topRevenue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    minWidth: 70,
    textAlign: 'right',
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  saleId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saleDate: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  saleAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  saleAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Table
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 6,
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  td: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  // Formulas
  formulasCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formulasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formulaItem: {
    marginBottom: 12,
  },
  formulaName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  formulaDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  // Pending sales
  pendingCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0A0',
    gap: 10,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD814',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingHeaderInfo: { flex: 1, gap: 2 },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: '#8B6914' },
  pendingAmount: { fontSize: 13, fontWeight: '500', color: '#8B6914' },
  pendingOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  pendingOrderInfo: { flex: 1, gap: 2 },
  pendingOrderId: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pendingOrderMeta: { fontSize: 11, color: Colors.textSecondary },
  pendingOrderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#067D62',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmOrderText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  confirmedCard: {
    backgroundColor: '#E8F8F0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B8E6D0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmedTitle: { fontSize: 14, fontWeight: '600', color: '#067D62' },
  confirmedAmount: { fontSize: 16, fontWeight: '700', color: '#067D62' },
});
