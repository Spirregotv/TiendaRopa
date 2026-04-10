import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';

import DashboardScreen from '../screens/admin/DashboardScreen';
import OrdersScreen from '../screens/admin/OrdersScreen';
import ProductsScreen from '../screens/admin/ProductsScreen';
import ProductFormScreen from '../screens/admin/ProductFormScreen';

const Tab = createBottomTabNavigator();
const ProductStack = createNativeStackNavigator();

// Stack independiente para que el formulario de producto tenga su propio header
function ProductStackNavigator() {
  return (
    <ProductStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ProductStack.Screen
        name="ProductsList"
        component={ProductsScreen}
        options={{ title: 'Productos' }}
      />
      <ProductStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) => ({
          title: route.params?.product ? 'Editar Producto' : 'Nuevo Producto',
        })}
      />
    </ProductStack.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.surface,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'view-dashboard-outline',
            Pedidos: 'shopping-outline',
            Productos: 'hanger',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerTitle: 'FashionFlow Admin' }}
      />
      <Tab.Screen
        name="Pedidos"
        component={OrdersScreen}
        options={{ title: 'Pedidos' }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductStackNavigator}
        options={{ title: 'Productos', headerShown: false }}
      />
    </Tab.Navigator>
  );
}
