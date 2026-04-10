import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { InventoryProvider, useInventory } from './src/context/InventoryContext';
import { OrdersProvider } from './src/context/OrdersContext';
import { ProfileProvider } from './src/context/ProfileContext'; // ✅ NUEVO
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

const AuthStack = createNativeStackNavigator();
const ClientStack = createNativeStackNavigator();
const ClientTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

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

// --- Admin Tabs (authenticated as admin) ---
function AdminNavigator() {
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
        name="Gestión"
        component={InventoryScreen}
        initialParams={{ manageMode: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
}

// --- Root: Conditional navigation based on userRole ---
function RootNavigator() {
  const { userRole } = useInventory();

  if (userRole === null) {
    return <AuthNavigator />;
  }

  if (userRole === 'admin') {
    return <AdminNavigator />;
  }

  return <ClientNavigator />;
}

export default function App() {
  return (
    <InventoryProvider>
      <OrdersProvider>
        <ProfileProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ProfileProvider>
      </OrdersProvider>
    </InventoryProvider>
  );
}
