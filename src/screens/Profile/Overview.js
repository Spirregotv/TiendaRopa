import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useProfile } from '../../context/ProfileContext';
import { useInventory } from '../../context/InventoryContext';
import { useOrders } from '../../context/OrdersContext';

const SummaryCard = ({ title, icon, children, onEdit }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleRow}>
        <MaterialCommunityIcons name={icon} size={22} color={Colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.editBtn}>Editar</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.cardContent}>{children}</View>
  </View>
);

export default function Overview({ navigation }) {
  const { profile, handleLogout, isHydrated } = useProfile();
  const { logout } = useInventory();
  const { orders } = useOrders();

  // ─── Loading mientras se cargan datos del disco ─────────────────────────
  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Safe display values — evita crash si hay campos vacíos
  const displayName  = profile.fullName || 'Usuario';
  const displayEmail = profile.email || '';
  const displayPhone = profile.phone || 'No configurado';
  const displayAddress = profile.address?.street
    ? `${profile.address.street} ${profile.address.number},\n${profile.address.city}, CP ${profile.address.zipCode},\n${profile.address.state}`
    : 'No configurado';

  const doLogout = () => {
    logout();       // Cambia userRole → null → va al Login
    handleLogout(); // Limpia AsyncStorage en segundo plano
  };

  const onLogout = () => {
    if (Platform.OS === 'web') {
      // En web, Alert.alert puede no funcionar — usamos confirm nativo
      if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        <SummaryCard
          title="Datos Personales"
          icon="account-outline"
          onEdit={() => navigation.navigate('EditPersonal')}
        >
          <Text style={styles.infoLabel}>Nombre Completo</Text>
          <Text style={styles.infoValue}>{displayName}</Text>
          <Text style={[styles.infoLabel, { marginTop: 8 }]}>Teléfono</Text>
          <Text style={styles.infoValue}>{displayPhone}</Text>
        </SummaryCard>

        <SummaryCard
          title="Domicilio de Envío"
          icon="map-marker-outline"
          onEdit={() => navigation.navigate('EditAddress')}
        >
          <Text style={styles.infoValue}>{displayAddress}</Text>
        </SummaryCard>

        <SummaryCard
          title="Métodos de Pago"
          icon="credit-card-outline"
          onEdit={() => navigation.navigate('Payments')}
        >
          <Text style={styles.infoValue}>
            {profile.paymentMethods.length === 0
              ? 'Sin tarjetas guardadas'
              : `${profile.paymentMethods.length} tarjeta${profile.paymentMethods.length !== 1 ? 's' : ''} guardada${profile.paymentMethods.length !== 1 ? 's' : ''}`}
          </Text>
          <View style={styles.cardPreviewRow}>
            {profile.paymentMethods.map((card) => (
              <MaterialCommunityIcons
                key={card.id}
                name="credit-card"
                size={24}
                color={card.color}
                style={{ marginRight: 8 }}
              />
            ))}
          </View>
        </SummaryCard>

        {/* ✅ Mis Pedidos */}
        <TouchableOpacity
          style={styles.ordersCard}
          onPress={() => navigation.navigate('MyOrders')}
          activeOpacity={0.7}
        >
          <View style={styles.ordersCardLeft}>
            <View style={styles.ordersIconBox}>
              <Ionicons name="receipt-outline" size={22} color="#007185" />
            </View>
            <View>
              <Text style={styles.ordersCardTitle}>Mis Pedidos</Text>
              <Text style={styles.ordersCardSub}>
                {orders.length === 0
                  ? 'Aún no tienes pedidos'
                  : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} realizados`}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },

  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  editBtn: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  infoLabel: { fontSize: 11, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 16, color: Colors.textPrimary, marginTop: 2, lineHeight: 22 },
  cardPreviewRow: { flexDirection: 'row', marginTop: 12 },

  // Orders card
  ordersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  ordersCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ordersIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#E8F8F8',
    justifyContent: 'center', alignItems: 'center',
  },
  ordersCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  ordersCardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, marginTop: 10, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.danger + '40',
  },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});
