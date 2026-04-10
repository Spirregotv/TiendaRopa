import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import { useOrders, OXXO_ACCOUNT } from '../context/OrdersContext';

const AZ = { teal: '#007185', orange: '#FF9900', greenDeal: '#067D62' };

export default function ProfileScreen() {
  const { userName, userEmail, logout, cartDetails } = useInventory();
  const { orders } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const onLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) logout();
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  const openOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmado': return AZ.greenDeal;
      case 'Pendiente de Pago': return AZ.orange;
      case 'Entregado': return '#2196F3';
      default: return Colors.textSecondary;
    }
  };

  const renderOrderCard = ({ item: order }) => {
    const firstItem = order.items[0];
    const dateStr = new Date(order.date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => openOrder(order)}>
        <Image
          source={{ uri: firstItem?.imageUrl }}
          style={styles.orderImage}
          resizeMode="cover"
        />
        <View style={styles.orderInfo}>
          <Text style={styles.orderId} numberOfLines={1}>
            Pedido #{order.orderId}
          </Text>
          <Text style={styles.orderDate}>{dateStr}</Text>
          <Text style={styles.orderItemCount}>
            {order.items.length} artículo{order.items.length > 1 ? 's' : ''}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderTotal}>
            {APP_CONFIG.currency}{order.total.toLocaleString()}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <FlatList
        data={[{ key: 'profile' }]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {/* User Card */}
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName || 'Usuario'}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cartDetails.cartCount}</Text>
                <Text style={styles.statLabel}>En Carrito</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{orders.length}</Text>
                <Text style={styles.statLabel}>Pedidos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Favoritos</Text>
              </View>
            </View>

            {/* Orders Section Header */}
            <View style={styles.ordersHeader}>
              <Ionicons name="bag-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.ordersTitle}>Mis Pedidos</Text>
              <Text style={styles.ordersCount}>{orders.length}</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            {/* Orders List */}
            {orders.length > 0 ? (
              orders.map((order) => (
                <View key={order.orderId} style={{ paddingHorizontal: 16 }}>
                  {renderOrderCard({ item: order })}
                </View>
              ))
            ) : (
              <View style={styles.emptyOrders}>
                <Ionicons name="receipt-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyTitle}>Sin pedidos todavía</Text>
                <Text style={styles.emptyText}>
                  Tus pedidos aparecerán aquí después de tu primera compra
                </Text>
              </View>
            )}

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Text style={styles.version}>{APP_CONFIG.storeName} v1.0.0</Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Pedido</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Order ID & Status */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalOrderId}>#{selectedOrder.orderId}</Text>
                  <Text style={styles.modalDate}>
                    {new Date(selectedOrder.date).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={[
                    styles.statusBadgeLg,
                    { backgroundColor: getStatusColor(selectedOrder.status) + '20' },
                  ]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedOrder.status) }]} />
                    <Text style={[styles.statusTextLg, { color: getStatusColor(selectedOrder.status) }]}>
                      {selectedOrder.status}
                    </Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Productos</Text>
                  {selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.modalItem}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.modalItemImage}
                        resizeMode="cover"
                      />
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemName} numberOfLines={1}>{item.nombre}</Text>
                        <Text style={styles.modalItemMeta}>Talla: {item.talla} · × {item.quantity}</Text>
                      </View>
                      <Text style={styles.modalItemPrice}>
                        {APP_CONFIG.currency}{(item.precioVenta * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Address */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Dirección</Text>
                  <Text style={styles.modalText}>
                    {selectedOrder.address.calle} #{selectedOrder.address.numero},{'\n'}
                    CP {selectedOrder.address.codigoPostal}, {selectedOrder.address.ciudad}
                  </Text>
                </View>

                {/* Payment */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Pago</Text>
                  <Text style={styles.modalText}>{selectedOrder.paymentMethod}</Text>
                  {selectedOrder.paymentRef && (
                    <View style={styles.refBox}>
                      <Text style={styles.refLabel}>Referencia Oxxo:</Text>
                      <Text style={styles.refValue}>{selectedOrder.paymentRef}</Text>
                      <Text style={styles.refAccount}>Cuenta: {OXXO_ACCOUNT}</Text>
                    </View>
                  )}
                </View>

                {/* Totals */}
                <View style={styles.modalSection}>
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalTotalLabel}>Subtotal</Text>
                    <Text style={styles.modalTotalValue}>
                      {APP_CONFIG.currency}{selectedOrder.subtotal?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalTotalLabel}>Envío</Text>
                    <Text style={styles.modalTotalValue}>
                      {selectedOrder.shippingCost === 0
                        ? 'GRATIS'
                        : `${APP_CONFIG.currency}${selectedOrder.shippingCost}`}
                    </Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalGrandLabel}>Total</Text>
                    <Text style={styles.modalGrandValue}>
                      {APP_CONFIG.currency}{selectedOrder.total.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },

  userCard: {
    flexDirection: 'row', alignItems: 'center', margin: 16, padding: 20,
    backgroundColor: Colors.surface, borderRadius: 16, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '600', color: Colors.textWhite },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: 13, color: Colors.textSecondary },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.6 },
  statDivider: { width: 1, backgroundColor: Colors.borderLight },

  // Orders section
  ordersHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  ordersTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  ordersCount: {
    fontSize: 12, fontWeight: '700', color: Colors.textWhite,
    backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },

  orderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  orderImage: { width: 56, height: 70, borderRadius: 10, backgroundColor: Colors.surfaceAlt },
  orderInfo: { flex: 1, marginLeft: 12, gap: 2 },
  orderId: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  orderDate: { fontSize: 11, color: Colors.textLight },
  orderItemCount: { fontSize: 11, color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  emptyOrders: { alignItems: 'center', paddingVertical: 40, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 16, marginTop: 20, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.danger, gap: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textLight, marginTop: 20, marginBottom: 30 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    maxHeight: '85%', backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },

  modalSection: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  modalOrderId: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalDate: { fontSize: 13, color: Colors.textSecondary },
  statusBadgeLg: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  statusTextLg: { fontSize: 13, fontWeight: '600' },

  modalSectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
  },
  modalItemImage: { width: 44, height: 55, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  modalItemInfo: { flex: 1, gap: 2 },
  modalItemName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  modalItemMeta: { fontSize: 11, color: Colors.textLight },
  modalItemPrice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  modalText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },

  refBox: {
    padding: 12, backgroundColor: '#FFF8E7', borderRadius: 10,
    borderWidth: 1, borderColor: '#FFE0A0', gap: 4,
  },
  refLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase' },
  refValue: { fontSize: 18, fontWeight: '700', color: AZ.teal, letterSpacing: 1 },
  refAccount: { fontSize: 12, color: Colors.textSecondary },

  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  modalTotalLabel: { fontSize: 14, color: Colors.textSecondary },
  modalTotalValue: { fontSize: 14, color: Colors.textPrimary },
  modalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  modalGrandLabel: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalGrandValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
});
