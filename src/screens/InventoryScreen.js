import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import CardPrenda from '../components/CardPrenda';
import AdminHeader from '../components/AdminHeader';

const EMPTY_FORM = {
  nombre: '',
  talla: '',
  stock: '',
  costoAdquisicion: '',
  precioVenta: '',
  gender: 'mujer',
};

export default function InventoryScreen({ route, navigation }) {
  const { items, isAdmin, addItem, deleteItem, logout } = useInventory();
  const isManageMode = route?.params?.manageMode;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleAdd = () => {
    const { nombre, talla, stock, costoAdquisicion, precioVenta, gender } = form;
    if (!nombre || !talla || !stock || !costoAdquisicion || !precioVenta || !gender) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }
    if (isNaN(stock) || isNaN(costoAdquisicion) || isNaN(precioVenta)) {
      Alert.alert('Error', 'Stock, costo y precio deben ser números válidos.');
      return;
    }
    addItem(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Prenda',
      '¿Estás seguro de que deseas eliminar esta prenda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteItem(id) },
      ]
    );
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {isAdmin && isManageMode && <AdminHeader onLogout={logout} />}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {isManageMode ? 'Gestión de Inventario' : 'Inventario'}
          </Text>
          <Text style={styles.subtitle}>
            {items.length} productos · {items.reduce((s, i) => s + i.stock, 0)}{' '}
            unidades
          </Text>
        </View>
        {isAdmin && isManageMode && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('ProductForm')}
          >
            <Ionicons name="add" size={22} color={Colors.textWhite} />
          </TouchableOpacity>
        )}
      </View>

      {/* Add Form */}
      {showForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva Prenda</Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Blazer Oversize"
                  placeholderTextColor={Colors.textLight}
                  value={form.nombre}
                  onChangeText={(v) => updateField('nombre', v)}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Talla</Text>
                <TextInput
                  style={styles.input}
                  placeholder="S/M/L"
                  placeholderTextColor={Colors.textLight}
                  value={form.talla}
                  onChangeText={(v) => updateField('talla', v)}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Gender selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Género</Text>
              <View style={styles.genderRow}>
                {['hombre', 'mujer', 'unisex'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      form.gender === g && styles.genderBtnActive,
                    ]}
                    onPress={() => updateField('gender', g)}
                  >
                    <Ionicons
                      name={g === 'hombre' ? 'man' : g === 'mujer' ? 'woman' : 'people'}
                      size={14}
                      color={form.gender === g ? Colors.textWhite : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.genderBtnText,
                        form.gender === g && styles.genderBtnTextActive,
                      ]}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Stock</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  value={form.stock}
                  onChangeText={(v) => updateField('stock', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Costo Compra</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$0"
                  placeholderTextColor={Colors.textLight}
                  value={form.costoAdquisicion}
                  onChangeText={(v) => updateField('costoAdquisicion', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Precio Venta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$0"
                  placeholderTextColor={Colors.textLight}
                  value={form.precioVenta}
                  onChangeText={(v) => updateField('precioVenta', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
              <Ionicons name="checkmark" size={18} color={Colors.textWhite} />
              <Text style={styles.submitBtnText}>Agregar Prenda</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CardPrenda
            item={item}
            showAdmin={isAdmin && isManageMode}
            onDelete={handleDelete}
            onEdit={
              isAdmin && isManageMode
                ? () => navigation.navigate('ProductForm', { product: item })
                : undefined
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="shirt-outline"
              size={48}
              color={Colors.borderLight}
            />
            <Text style={styles.emptyText}>No hay prendas en inventario</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 12,
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
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  genderBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  genderBtnTextActive: {
    color: Colors.textWhite,
    fontWeight: '600',
  },
});
