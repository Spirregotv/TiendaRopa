/**
 * StockAlert — Indicador visual de stock crítico
 *
 * Reglas:
 *   stock === 0          → AGOTADO (rojo sólido)
 *   0 < stock < 5        → STOCK BAJO (naranja)
 *   stock >= 5           → null (no renderiza nada)
 *
 * Se puede usar de dos formas:
 *   1. <StockAlert stock={item.stock} />          → solo indicador
 *   2. <StockAlert stock={item.stock} nombre="Blazer" showName /> → con nombre
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const THRESHOLD = 5;

export default function StockAlert({ stock, nombre, showName = false, compact = false }) {
  const isSoldOut = stock === 0;
  const isLow = stock > 0 && stock < THRESHOLD;

  if (!isSoldOut && !isLow) return null;

  const config = isSoldOut
    ? {
        bg: Colors.danger,
        textColor: '#fff',
        icon: 'warning',
        label: 'AGOTADO',
        sublabel: 'Sin unidades disponibles',
      }
    : {
        bg: Colors.warning,
        textColor: '#fff',
        icon: 'alert-circle-outline',
        label: `STOCK BAJO`,
        sublabel: `Solo ${stock} unidad${stock !== 1 ? 'es' : ''} restante${stock !== 1 ? 's' : ''}`,
      };

  if (compact) {
    // Versión compacta: solo el pill con número
    return (
      <View style={[styles.compactPill, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={11} color="#fff" />
        <Text style={styles.compactText}>
          {isSoldOut ? 'Agotado' : `${stock} uds`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.alert, { backgroundColor: config.bg + '15', borderColor: config.bg }]}>
      <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={16} color="#fff" />
      </View>
      <View style={styles.textWrapper}>
        {showName && nombre ? (
          <Text style={[styles.name, { color: config.bg }]} numberOfLines={1}>
            {nombre}
          </Text>
        ) : null}
        <Text style={[styles.label, { color: config.bg }]}>{config.label}</Text>
        <Text style={styles.sublabel}>{config.sublabel}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={styles.badgeText}>{stock}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  // Compact mode
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
