import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import StockAlert from './StockAlert';

export default function CardPrenda({ item, onDelete, onEdit, showAdmin }) {
  const isLowStock = item.stock < APP_CONFIG.lowStockThreshold;
  const margen =
    item.precioVenta > 0
      ? ((item.precioVenta - item.costoAdquisicion) / item.precioVenta) * 100
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.talla}>Talla {item.talla}</Text>
        </View>
        {/* StockAlert compact: rojo si stock=0, naranja si stock<5 */}
        <StockAlert stock={item.stock} compact />
      </View>

      {/* Alerta de stock expandida debajo del header */}
      {item.stock < 5 && (
        <View style={{ marginBottom: 10 }}>
          <StockAlert stock={item.stock} />
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Stock</Text>
          <Text style={[styles.infoValue, isLowStock && styles.dangerText]}>
            {item.stock}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Costo</Text>
          <Text style={styles.infoValue}>
            {APP_CONFIG.currency}{item.costoAdquisicion.toLocaleString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Precio</Text>
          <Text style={[styles.infoValue, styles.priceText]}>
            {APP_CONFIG.currency}{item.precioVenta.toLocaleString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Margen</Text>
          <Text style={[styles.infoValue, styles.margenText]}>
            {margen.toFixed(1)}%
          </Text>
        </View>
      </View>

      {showAdmin && (
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
              <Ionicons name="create-outline" size={15} color={Colors.accent} />
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={15} color={Colors.danger} />
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nombre: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  talla: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dangerText: {
    color: Colors.danger,
  },
  priceText: {
    color: Colors.primary,
  },
  margenText: {
    color: Colors.success,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  editText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
