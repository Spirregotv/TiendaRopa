import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import { APP_CONFIG, CATEGORIES, AVAILABLE_SIZES } from '../../constants/Config';
import { useInventory } from '../../context/InventoryContext';

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.id !== 'all');

export default function ProductFormScreen({ navigation, route }) {
  const { addItem, updateItem } = useInventory();
  const editingProduct = route.params?.product ?? null;
  const isEditing = !!editingProduct;

  const [nombre, setNombre] = useState(editingProduct?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(editingProduct?.descripcion ?? '');
  const [precio, setPrecio] = useState(
    editingProduct ? String(editingProduct.precioVenta) : ''
  );
  const [costo, setCosto] = useState(
    editingProduct ? String(editingProduct.costoAdquisicion) : ''
  );
  const [categoria, setCategoria] = useState(
    editingProduct?.categoria ?? 'mujer'
  );

  // ── Variantes por talla con stock individual ──────────────────────────
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState(
    editingProduct?.tallasDisponibles ?? ['M']
  );

  // stockPorTalla: { S: "5", M: "10", ... } — strings para TextInput
  const [stockPorTalla, setStockPorTalla] = useState(() => {
    if (editingProduct?.stockPorTalla) {
      const obj = {};
      for (const [k, v] of Object.entries(editingProduct.stockPorTalla)) {
        obj[k] = String(v);
      }
      return obj;
    }
    return { M: '0' };
  });

  const [images, setImages] = useState(
    editingProduct?.gallery?.length
      ? editingProduct.gallery
      : editingProduct?.imageUrl
      ? [editingProduct.imageUrl]
      : []
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Editar Producto' : 'Nuevo Producto',
    });
  }, [isEditing]);

  // Sync stockPorTalla when tallas change
  const toggleTalla = (talla) => {
    setTallasSeleccionadas((prev) => {
      const exists = prev.includes(talla);
      if (exists) {
        // Al quitar talla, eliminar su stock
        setStockPorTalla((s) => {
          const copy = { ...s };
          delete copy[talla];
          return copy;
        });
        return prev.filter((t) => t !== talla);
      }
      // Al agregar talla, inicializar su stock en 0
      setStockPorTalla((s) => ({ ...s, [talla]: '0' }));
      return [...prev, talla];
    });
  };

  const updateTallaStock = (talla, value) => {
    setStockPorTalla((prev) => ({ ...prev, [talla]: value }));
  };

  const totalStock = Object.values(stockPorTalla).reduce(
    (sum, v) => sum + (parseInt(v, 10) || 0),
    0
  );

  // ── Image picker ──────────────────────────────────────────────────────
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para subir imágenes.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 4));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!precio || isNaN(Number(precio)) || Number(precio) <= 0)
      newErrors.precio = 'Ingresa un precio válido';
    if (!costo || isNaN(Number(costo)) || Number(costo) <= 0)
      newErrors.costo = 'Ingresa un costo válido';
    if (tallasSeleccionadas.length === 0)
      newErrors.tallas = 'Selecciona al menos una talla';

    // Validar stock > 0 solo al crear un producto nuevo
    if (!isEditing) {
      const hasStock = Object.values(stockPorTalla).some(
        (v) => parseInt(v, 10) > 0
      );
      if (!hasStock) newErrors.stock = 'Al menos una talla debe tener stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    // Convertir stockPorTalla de strings a numbers
    const stockNum = {};
    for (const [k, v] of Object.entries(stockPorTalla)) {
      if (tallasSeleccionadas.includes(k)) {
        stockNum[k] = Math.max(0, parseInt(v, 10) || 0);
      }
    }

    const productData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precioVenta: Number(precio),
      costoAdquisicion: Number(costo),
      stockPorTalla: stockNum,
      categoria,
      gender: categoria,
      tallasDisponibles: tallasSeleccionadas,
      talla: tallasSeleccionadas[0],
      imageUrl: images[0] ?? null,
      gallery: images,
      bestseller: isEditing ? (editingProduct.bestseller ?? false) : false,
    };

    try {
      if (isEditing) {
        updateItem(editingProduct.id, productData);
      } else {
        addItem(productData);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Images ── */}
          <Text style={styles.label}>Imágenes del producto</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesRow}
          >
            {images.map((uri, i) => (
              <View key={i} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.productImage} />
                {i === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Principal</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImgBtn}
                  onPress={() => removeImage(i)}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 4 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={28} color={Colors.accent} />
                <Text style={styles.addImageText}>Agregar</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* ── Nombre ── */}
          <Field
            label="Nombre del producto *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Blazer Oversize Negro"
            error={errors.nombre}
          />

          {/* ── Descripción ── */}
          <Field
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Material, estilo, ocasión..."
            multiline
            numberOfLines={3}
          />

          {/* ── Precios ── */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Precio de venta *"
                value={precio}
                onChangeText={setPrecio}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix={APP_CONFIG.currency}
                error={errors.precio}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field
                label="Costo adquisición *"
                value={costo}
                onChangeText={setCosto}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix={APP_CONFIG.currency}
                error={errors.costo}
              />
            </View>
          </View>

          {/* Margin preview */}
          {precio && costo && !isNaN(Number(precio)) && Number(precio) > 0 && (
            <View style={styles.marginPreview}>
              <Ionicons name="trending-up-outline" size={16} color={Colors.success} />
              <Text style={styles.marginText}>
                Margen:{' '}
                {(
                  ((Number(precio) - Number(costo)) / Number(precio)) *
                  100
                ).toFixed(1)}
                %
              </Text>
            </View>
          )}

          {/* ── Categoría ── */}
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.optionsRow}>
            {CATEGORY_OPTIONS.map((cat) => {
              const active = categoria === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.optionBtn, active && styles.optionBtnActive]}
                  onPress={() => setCategoria(cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={active ? '#fff' : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.optionText, active && styles.optionTextActive]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Tallas + Stock por variante ── */}
          <Text style={styles.label}>Variantes por Talla *</Text>
          {errors.tallas && (
            <Text style={styles.errorText}>{errors.tallas}</Text>
          )}
          <View style={styles.optionsRow}>
            {AVAILABLE_SIZES.map((talla) => {
              const active = tallasSeleccionadas.includes(talla);
              return (
                <TouchableOpacity
                  key={talla}
                  style={[styles.tallaBtn, active && styles.tallaBtnActive]}
                  onPress={() => toggleTalla(talla)}
                >
                  <Text
                    style={[styles.tallaText, active && styles.tallaTextActive]}
                  >
                    {talla}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Stock por talla (inputs individuales) ── */}
          {tallasSeleccionadas.length > 0 && (
            <View style={styles.stockSection}>
              <View style={styles.stockHeader}>
                <Text style={styles.stockSectionTitle}>Stock por Talla</Text>
                <View style={styles.totalStockPill}>
                  <Text style={styles.totalStockText}>
                    Total: {totalStock} uds
                  </Text>
                </View>
              </View>
              {errors.stock && (
                <Text style={styles.errorText}>{errors.stock}</Text>
              )}
              <View style={styles.stockGrid}>
                {tallasSeleccionadas.map((talla) => (
                  <View key={talla} style={styles.stockItem}>
                    <View style={styles.stockTallaBadge}>
                      <Text style={styles.stockTallaText}>{talla}</Text>
                    </View>
                    <TextInput
                      style={styles.stockInput}
                      value={stockPorTalla[talla] || '0'}
                      onChangeText={(v) => updateTallaStock(talla, v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textLight}
                      selectTextOnFocus
                    />
                    <Text style={styles.stockUnit}>uds</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.saveText}>
                  {isEditing ? 'Guardar cambios' : 'Agregar producto'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  error,
  multiline,
  numberOfLines,
  prefix,
  ...inputProps
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, multiline && { height: 72, textAlignVertical: 'top' }]}
          placeholderTextColor={Colors.textLight}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 8 },
  imagesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  imageWrapper: { position: 'relative' },
  productImage: {
    width: 90, height: 90, borderRadius: 12, backgroundColor: Colors.surfaceAlt,
  },
  mainBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: Colors.accent, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  mainBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  removeImgBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#fff', borderRadius: 11,
  },
  addImageBtn: {
    width: 90, height: 90, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.accent, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  fieldWrapper: { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    marginBottom: 6, letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  inputError: { borderColor: Colors.danger },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: 10 },
  prefix: { fontSize: 15, color: Colors.textSecondary, marginRight: 4 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 },
  errorText: { fontSize: 11, color: Colors.danger, marginTop: 4, marginLeft: 2 },
  row: { flexDirection: 'row' },
  marginPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10,
    marginBottom: 16, marginTop: -8,
  },
  marginText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  optionTextActive: { color: '#fff' },
  tallaBtn: {
    width: 44, height: 44, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface,
  },
  tallaBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tallaText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tallaTextActive: { color: '#fff' },
  // Stock por talla section
  stockSection: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 20,
  },
  stockHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  stockSectionTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.textPrimary,
  },
  totalStockPill: {
    backgroundColor: Colors.accent + '20', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  totalStockText: {
    fontSize: 12, fontWeight: '700', color: Colors.accent,
  },
  stockGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  stockItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceAlt, borderRadius: 10, padding: 8,
    minWidth: 120,
  },
  stockTallaBadge: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stockTallaText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stockInput: {
    flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
    textAlign: 'center', paddingVertical: 4,
    borderBottomWidth: 1.5, borderBottomColor: Colors.border,
  },
  stockUnit: { fontSize: 11, color: Colors.textLight },
  // Footer
  footer: {
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 24,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
