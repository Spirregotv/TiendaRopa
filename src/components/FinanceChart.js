import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';

export default function FinanceChart({ financials }) {
  const {
    inversionTotal,
    ventaPotencial,
    gananciaProyectada,
    totalItems,
    totalUnidades,
  } = financials;

  const margenGlobal =
    ventaPotencial > 0
      ? ((ventaPotencial - inversionTotal) / ventaPotencial) * 100
      : 0;

  const barWidth =
    ventaPotencial > 0 ? (inversionTotal / ventaPotencial) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* KPI Cards row */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="cube-outline" size={22} color={Colors.accent} />
          <Text style={styles.kpiValue}>{totalItems}</Text>
          <Text style={styles.kpiLabel}>Productos</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="layers-outline" size={22} color={Colors.accent} />
          <Text style={styles.kpiValue}>{totalUnidades}</Text>
          <Text style={styles.kpiLabel}>Unidades</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="trending-up-outline" size={22} color={Colors.accent} />
          <Text style={styles.kpiValue}>{margenGlobal.toFixed(1)}%</Text>
          <Text style={styles.kpiLabel}>Margen</Text>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen Financiero</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.dot, { backgroundColor: '#E53935' }]} />
          <Text style={styles.summaryLabel}>Inversión Total</Text>
          <Text style={styles.summaryAmount}>
            {APP_CONFIG.currency}{inversionTotal.toLocaleString()}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.summaryLabel}>Venta Potencial</Text>
          <Text style={styles.summaryAmount}>
            {APP_CONFIG.currency}{ventaPotencial.toLocaleString()}
          </Text>
        </View>

        {/* Visual bar */}
        <View style={styles.barContainer}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${barWidth}%` }]} />
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabel}>Inversión</Text>
            <Text style={styles.barLabel}>Venta</Text>
          </View>
        </View>

        <View style={styles.profitRow}>
          <Text style={styles.profitLabel}>Ganancia Proyectada</Text>
          <Text style={styles.profitAmount}>
            {APP_CONFIG.currency}{gananciaProyectada.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.accentLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  barContainer: {
    marginVertical: 16,
  },
  barBg: {
    height: 10,
    backgroundColor: Colors.accentLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.danger,
    borderRadius: 5,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  profitLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profitAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
});
