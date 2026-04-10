import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Overview from './Overview';
import EditPersonal from './EditPersonal';
import EditAddress from './EditAddress';
import Payments from './Payments';
import CardDetail from './CardDetail';
import MyOrders from './MyOrders';
import Colors from '../../constants/Colors';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
        headerTintColor: Colors.primary,
      }}
    >
      <Stack.Screen 
        name="ProfileOverview" 
        component={Overview} 
        options={{ title: 'Mi Perfil' }} 
      />
      <Stack.Screen 
        name="EditPersonal" 
        component={EditPersonal} 
        options={{ title: 'Datos Personales' }} 
      />
      <Stack.Screen 
        name="EditAddress" 
        component={EditAddress} 
        options={{ title: 'Domicilio' }} 
      />
      <Stack.Screen 
        name="Payments" 
        component={Payments} 
        options={{ title: 'Métodos de Pago' }} 
      />
      <Stack.Screen 
        name="CardDetail" 
        component={CardDetail} 
        options={{ title: 'Detalle de Tarjeta' }} 
      />
      <Stack.Screen 
        name="MyOrders" 
        component={MyOrders} 
        options={{ title: 'Mis Pedidos' }} 
      />
    </Stack.Navigator>
  );
}
