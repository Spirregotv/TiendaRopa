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
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrdersContext';
import AdminHeader from '../components/AdminHeader';
import FinanceChart from '../components/FinanceChart';

export default function FinanceScreen() {
  const { financials, logout } = useInventory();
  const { orderStats, updateOrderStatus } = useOrders();

  const handleConfirmOrder = (orderId) => {
    Alert.alert(
      'Confirmar Pedido',
      '¿Marcar este pedido como pagado/confirmado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => updateOrderStatus(orderId, 'Confirmado'),
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
            Resumen de inversión y proyección de ganancias
          </Text>
        </View>

        <View style={styles.content}>
          {/* Pending Sales Alert */}
          {orderStats.pendingCount > 0 && (
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <View style={styles.pendingIconCircle}>
                  <Text style={styles.bellIcon}>🔔</Text>
                </View>
                <View style={styles.pendingHeaderInfo}>
                  <Text style={styles.pendingTitle}>
                    {orderStats.pendingCount} Venta{orderStats.pendingCount > 1 ? 's' : ''} Pendiente{orderStats.pendingCount > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.pendingAmount}>
                    Total: {APP_CONFIG.currency}{orderStats.pendingTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {orderStats.pendingOrders.map((order) => (
                <View key={order.orderId} style={styles.pendingOrderRow}>
                  <View style={styles.pendingOrderInfo}>
                    <Text style={styles.pendingOrderId}>#{order.orderId}</Text>
                    <Text style={styles.pendingOrderMeta}>
                      {order.paymentMethod} · {new Date(order.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.pendingOrderTotal}>
                    {APP_CONFIG.currency}{order.total.toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    style={styles.confirmOrderBtn}
                    onPress={() => handleConfirmOrder(order.orderId)}
                  >
                    <Text style={styles.confirmOrderText}>Dar Alta</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Confirmed Sales Summary */}
          {orderStats.confirmedCount > 0 && (
            <View style={styles.confirmedCard}>
              <Text style={styles.confirmedTitle}>
                ✅ {orderStats.confirmedCount} Venta{orderStats.confirmedCount > 1 ? 's' : ''} Confirmada{orderStats.confirmedCount > 1 ? 's' : ''}
              </Text>
              <Text style={styles.confirmedAmount}>
                {APP_CONFIG.currency}{orderStats.confirmedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          <FinanceChart financials={financials} />

          {/* Per-item margin table */}
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
                  {APP_CONFIG.currency}{item.costoAdquisicion}
                </Text>
                <Text style={styles.td}>
                  {APP_CONFIG.currency}{item.precioVenta}
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

          {/* Formulas Reference */}
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
          </View>
        </View>
      </ScrollView>
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
  bellIcon: { fontSize: 20 },
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
  pendingOrderId: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  pendingOrderMeta: { fontSize: 11, color: Colors.textSecondary },
  pendingOrderTotal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginRight: 8 },
  confirmOrderBtn: {
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
  confirmedTitle: { fontSize: 14, fontWeight: '600', color: '#067D62' },
  confirmedAmount: { fontSize: 16, fontWeight: '700', color: '#067D62' },
});
