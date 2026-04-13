import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';

export default function HomeScreen({ navigation }) {
  const { items, financials } = useInventory();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{APP_CONFIG.storeName}</Text>
          <Text style={styles.heroSubtitle}>{APP_CONFIG.storeTagline}</Text>
          <View style={styles.heroDivider} />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="shirt-outline" size={24} color={Colors.accent} />
            <Text style={styles.statValue}>{financials.totalItems}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={24} color={Colors.accent} />
            <Text style={styles.statValue}>{financials.totalUnidades}</Text>
            <Text style={styles.statLabel}>Unidades</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={
                financials.lowStockItems.length > 0
                  ? Colors.danger
                  : Colors.success
              }
            />
            <Text
              style={[
                styles.statValue,
                financials.lowStockItems.length > 0 && styles.dangerText,
              ]}
            >
              {financials.lowStockItems.length}
            </Text>
            <Text style={styles.statLabel}>Stock Bajo</Text>
          </View>
        </View>

        {/* Low Stock Alert */}
        {financials.lowStockItems.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning-outline" size={18} color={Colors.danger} />
              <Text style={styles.alertTitle}>Alertas de Stock</Text>
            </View>
            {financials.lowStockItems.map((item) => (
              <View key={item.id} style={styles.alertItem}>
                <Text style={styles.alertItemName}>{item.nombre}</Text>
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>
                    {item.stock} uds.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Inventario')}
          >
            <Ionicons name="grid-outline" size={28} color={Colors.primary} />
            <Text style={styles.actionLabel}>Ver Inventario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Finanzas')}
          >
            <Ionicons
              name="stats-chart-outline"
              size={28}
              color={Colors.primary}
            />
            <Text style={styles.actionLabel}>Finanzas</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Items */}
        <Text style={styles.sectionTitle}>Últimos Productos</Text>
        {items.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.featuredCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.featuredName}>{item.nombre}</Text>
              <Text
                style={[
                  styles.featuredTalla,
                  item.agotado && { color: Colors.danger },
                  !item.agotado && item.stock <= APP_CONFIG.lowStockThreshold && { color: Colors.warning },
                ]}
              >
                {item.agotado
                  ? 'Agotado'
                  : item.stock <= APP_CONFIG.lowStockThreshold
                    ? `Stock bajo — ${item.stock} uds.`
                    : `${item.stock} unidades`}
              </Text>
            </View>
            <Text style={styles.featuredPrice}>
              {APP_CONFIG.currency}{item.precioVenta.toLocaleString()}
            </Text>
          </View>
        ))}
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
  hero: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 8,
  },
  heroDivider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.accent,
    alignSelf: 'center',
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dangerText: {
    color: Colors.danger,
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.danger,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  alertItemName: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  alertBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  alertBadgeText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  loginAction: {
    borderWidth: 1,
    borderColor: Colors.accentLight,
    borderStyle: 'dashed',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  featuredCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  featuredTalla: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  featuredPrice: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});
