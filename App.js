import React from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { InventoryProvider, useInventory } from './src/context/InventoryContext';
import { OrdersProvider, useOrders } from './src/context/OrdersContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { SalesHistoryProvider, useSalesHistory } from './src/context/SalesHistoryContext';
import Colors from './src/constants/Colors';

// Auth screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Client screens
import StoreScreen from './src/screens/StoreScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileStack from './src/screens/Profile/ProfileStack';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

// Admin screens
import HomeScreen from './src/screens/HomeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import OrdersScreen from './src/screens/Admin/OrdersScreen';
import ProductFormScreen from './src/screens/Admin/ProductFormScreen';

const AuthStack = createNativeStackNavigator();
const ClientStack = createNativeStackNavigator();
const ClientTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator();

const TAB_STYLE = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderLight,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.textLight,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
};

// --- Auth Stack (not authenticated) ---
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </AuthStack.Navigator>
  );
}

// --- Client Tab bar ---
function ClientTabNavigator() {
  const { cartDetails } = useInventory();

  return (
    <ClientTab.Navigator screenOptions={TAB_STYLE}>
      <ClientTab.Screen
        name="Tienda"
        component={StoreScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <ClientTab.Screen
        name="Carrito"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" size={size} color={color} />
          ),
          tabBarBadge: cartDetails.cartCount > 0 ? cartDetails.cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.danger,
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      />
      <ClientTab.Screen
        name="Perfil"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </ClientTab.Navigator>
  );
}

// --- Client Stack (tabs + detail + checkout) ---
function ClientNavigator() {
  return (
    <ClientStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientStack.Screen name="ClientTabs" component={ClientTabNavigator} />
      <ClientStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <ClientStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </ClientStack.Navigator>
  );
}

// Placeholder vacío para el tab de logout (nunca se renderiza)
function LogoutPlaceholder() {
  return <View />;
}

// --- Admin Tabs ---
function AdminTabs() {
  const { logout } = useInventory();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar sesión como administrador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <AdminTab.Navigator screenOptions={TAB_STYLE}>
      <AdminTab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Pedidos"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Inventario"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Finanzas"
        component={FinanceScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Salir"
        component={LogoutPlaceholder}
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="log-out-outline" size={size} color={Colors.danger} />
          ),
          tabBarLabel: 'Salir',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', color: Colors.danger },
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={handleLogout}
              style={[props.style, styles.logoutTab]}
            />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
}

// --- Admin Stack (tabs + product form modal) ---
function AdminNavigator() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen
        name="AdminTabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{
          title: 'Nuevo Producto',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
        }}
      />
    </AdminStack.Navigator>
  );
}

// --- Bridge: connects OrdersContext with SalesHistoryContext ---
function SalesHistoryBridge({ children }) {
  const { setArchiveFn } = useOrders();
  const { archiveSale } = useSalesHistory();

  React.useEffect(() => {
    setArchiveFn(archiveSale);
  }, [archiveSale, setArchiveFn]);

  return children;
}

// --- Root: Conditional navigation based on userRole ---
function RootNavigator() {
  const { userRole, isHydrated } = useInventory();

  // Esperar a que AsyncStorage cargue la sesión antes de decidir el navigator.
  // Sin esto, userRole empieza en null → muestra login → luego salta al rol
  // correcto, lo que causa el flash y la confusión de "me mandó al admin".
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (userRole === null) {
    return <AuthNavigator />;
  }

  if (userRole === 'admin') {
    return <AdminNavigator />;
  }

  return <ClientNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logoutTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function App() {
  return (
    <InventoryProvider>
      <OrdersProvider>
        <SalesHistoryProvider>
          <ProfileProvider>
            <SalesHistoryBridge>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </SalesHistoryBridge>
          </ProfileProvider>
        </SalesHistoryProvider>
      </OrdersProvider>
    </InventoryProvider>
  );
}
