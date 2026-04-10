/**
 * OrderCard — Componente de administrador
 *
 * Muestra la información de un pedido y botones de acción dinámicos
 * según el estado actual del pedido. La lógica de transición es:
 *
 *   Pendiente de Pago → [Confirmar Pago] (llama confirmarPago → valida stock)
 *   Pago Recibido     → [Iniciar Preparación]
 *   En Preparación    → [Marcar como Enviado]
 *   Enviado           → [Marcar como Entregado]
 *   Entregado         → sin acciones (estado final)
 *   Cancelado         → sin acciones (estado final)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { STATUS_COLORS } from '../context/OrdersContext';
import { useOrders } from '../context/OrdersContext';
import { useInventory } from '../context/InventoryContext';

// Qué botón mostrar según el estado actual
const ACTION_MAP = {
  'Pendiente de Pago': {
    label: 'Confirmar Pago',
    icon: 'checkmark-circle-outline',
    color: '#067D62',
    next: 'Pago Recibido',
    isPago: true,
  },
  'Pago Recibido': {
    label: 'Iniciar Preparación',
    icon: 'construct-outline',
    color: '#7B61FF',
    next: 'En Preparación',
  },
  'En Preparación': {
    label: 'Marcar como Enviado',
    icon: 'airplane-outline',
    color: '#007185',
    next: 'Enviado',
  },
  'Enviado': {
    label: 'Confirmar Entrega',
    icon: 'home-outline',
    color: Colors.success,
    next: 'Entregado',
  },
};

export default function OrderCard({ order, expanded = false }) {
  const { confirmarPago, updateOrderStatus } = useOrders();
  const { items: inventoryItems, deductStock } = useInventory();
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(expanded);

  const statusColor = STATUS_COLORS[order.status] ?? Colors.textSecondary;
  const action = ACTION_MAP[order.status];

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleAction = async () => {
    if (!action) return;
    setLoading(true);

    try {
      if (action.isPago) {
        // Usa la transacción atómica con validación de stock
        await confirmarPago(order.orderId, inventoryItems, deductStock);
      } else {
        // Pasar inventoryItems para que al llegar a "Entregado" se archive con costos
        updateOrderStatus(order.orderId, action.next, inventoryItems);
      }
    } catch (err) {
      Alert.alert('No se pudo procesar', err.message, [{ text: 'Entendido' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar pedido',
      `¿Cancelar el pedido ${order.orderId}? Esta acción no se puede deshacer.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => updateOrderStatus(order.orderId, 'Cancelado'),
        },
      ]
    );
  };

  const isFinal =
    order.status === 'Entregado' || order.status === 'Cancelado';

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setIsExpanded((v) => !v)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.date}>{formatDate(order.date)}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {order.status}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textLight}
          />
        </View>
      </TouchableOpacity>

      {/* ── Summary row ── */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Ionicons name="person-outline" size={13} color={Colors.textLight} />
          <Text style={styles.summaryText} numberOfLines={1}>
            {order.userId}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="cube-outline" size={13} color={Colors.textLight} />
          <Text style={styles.summaryText}>
            {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.total}>
          {APP_CONFIG.currency}
          {order.total.toFixed(2)}
        </Text>
      </View>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <View style={styles.detail}>
          {/* Productos */}
          <Text style={styles.sectionLabel}>Productos</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImg} />
              ) : (
                <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                  <Ionicons name="shirt-outline" size={18} color={Colors.textLight} />
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.itemMeta}>
                  Talla: {item.talla} · ×{item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {APP_CONFIG.currency}
                {(item.precioVenta * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Dirección */}
          {order.address && (
            <>
              <Text style={styles.sectionLabel}>Envío a</Text>
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.addressText}>
                  {order.address.calle} {order.address.numero},{' '}
                  {order.address.ciudad} CP {order.address.codigoPostal}
                </Text>
              </View>
            </>
          )}

          {/* Pago */}
          <View style={styles.paymentRow}>
            <Ionicons
              name={
                order.paymentMethod?.includes('Oxxo') ? 'cash-outline' : 'card-outline'
              }
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.paymentText}>
              {order.paymentMethod}
              {order.paymentRef ? `  ·  Ref: ${order.paymentRef}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* ── Action buttons ── */}
      {!isFinal && (
        <View style={styles.actions}>
          {/* Cancelar siempre disponible mientras no sea estado final */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={loading}
          >
            <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          {/* Botón de avance de estado */}
          {action && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: action.color }]}
              onPress={handleAction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={action.icon} size={16} color="#fff" />
                  <Text style={styles.actionText}>{action.label}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Estado final badge */}
      {isFinal && (
        <View
          style={[
            styles.finalBadge,
            {
              backgroundColor:
                order.status === 'Entregado'
                  ? Colors.successLight
                  : Colors.dangerLight,
            },
          ]}
        >
          <Ionicons
            name={
              order.status === 'Entregado'
                ? 'checkmark-done-circle-outline'
                : 'close-circle-outline'
            }
            size={15}
            color={
              order.status === 'Entregado' ? Colors.success : Colors.danger
            }
          />
          <Text
            style={[
              styles.finalText,
              {
                color:
                  order.status === 'Entregado' ? Colors.success : Colors.danger,
              },
            ]}
          >
            Pedido {order.status.toLowerCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    gap: 8,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.4,
  },
  date: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detail: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: 14,
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  itemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  itemImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  paymentText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  finalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 12,
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  finalText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
