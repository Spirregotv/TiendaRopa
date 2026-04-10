import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { TextInput, Button, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, storage } from '../../config/firebase';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../config/theme';
import LoadingOverlay from '../../components/common/LoadingOverlay';

export default function ProductFormScreen({ route, navigation }) {
  const editProduct = route.params?.product ?? null;
  const isEditing = !!editProduct;

  // ─── Estado del formulario ────────────────────────────────────────────────
  const [name, setName] = useState(editProduct?.name ?? '');
  const [category, setCategory] = useState(editProduct?.category ?? '');
  const [price, setPrice] = useState(editProduct?.price?.toString() ?? '');
  const [description, setDescription] = useState(editProduct?.description ?? '');
  const [stock, setStock] = useState(editProduct?.stock?.toString() ?? '');
  const [images, setImages] = useState(editProduct?.images ?? []); // URLs ya subidas
  const [newImages, setNewImages] = useState([]); // URIs locales por subir
  const [deletedImages, setDeletedImages] = useState([]); // URLs a borrar en Storage

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Guardando...');
  const [errors, setErrors] = useState({});

  // ─── Permisos de galería ───────────────────────────────────────────────────
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para subir imágenes.'
      );
      return false;
    }
    return true;
  };

  // ─── Selección de imágenes ────────────────────────────────────────────────
  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeExistingImage = (url) => {
    setImages((prev) => prev.filter((u) => u !== url));
    setDeletedImages((prev) => [...prev, url]);
  };

  const removeNewImage = (uri) => {
    setNewImages((prev) => prev.filter((u) => u !== uri));
  };

  // ─── Subir imágenes a Firebase Storage ───────────────────────────────────
  const uploadImages = async (uris) => {
    const urls = [];
    for (const uri of uris) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  // ─── Validación ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'El nombre es requerido.';
    if (!category) e.category = 'Selecciona una categoría.';
    if (!price || isNaN(Number(price)) || Number(price) < 0)
      e.price = 'Ingresa un precio válido.';
    if (!stock || isNaN(Number(stock)) || Number(stock) < 0)
      e.stock = 'Ingresa una cantidad de stock válida.';
    if (!description.trim()) e.description = 'La descripción es requerida.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Guardar producto ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Subir imágenes nuevas
      setLoadingMsg('Subiendo imágenes...');
      const uploadedUrls = newImages.length > 0 ? await uploadImages(newImages) : [];

      // 2. Borrar imágenes eliminadas del Storage
      for (const url of deletedImages) {
        try {
          const path = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] ?? '');
          if (path) await deleteObject(ref(storage, path));
        } catch {
          // Ignorar si ya no existe
        }
      }

      const allImages = [...images, ...uploadedUrls];

      const productData = {
        name: name.trim(),
        category,
        price: Number(price),
        description: description.trim(),
        stock: Number(stock),
        images: allImages,
        updatedAt: serverTimestamp(),
      };

      setLoadingMsg(isEditing ? 'Actualizando producto...' : 'Creando producto...');

      if (isEditing) {
        await updateDoc(doc(db, 'products', editProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', `No se pudo guardar el producto: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalImages = images.length + newImages.length;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoadingOverlay visible={loading} message={loadingMsg} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Imágenes ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imágenes del Producto</Text>
          <Text style={styles.sectionSub}>Máximo 5 imágenes</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {/* Imágenes ya guardadas */}
            {images.map((url, i) => (
              <View key={`existing-${i}`} style={styles.imageThumb}>
                <Image source={{ uri: url }} style={styles.thumbImg} />
                <TouchableOpacity
                  style={styles.removeImg}
                  onPress={() => removeExistingImage(url)}
                >
                  <MaterialCommunityIcons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Imágenes nuevas (locales) */}
            {newImages.map((uri, i) => (
              <View key={`new-${i}`} style={styles.imageThumb}>
                <Image source={{ uri }} style={styles.thumbImg} />
                <View style={styles.newBadge}>
                  <MaterialCommunityIcons name="upload" size={10} color="#fff" />
                </View>
                <TouchableOpacity
                  style={styles.removeImg}
                  onPress={() => removeNewImage(uri)}
                >
                  <MaterialCommunityIcons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Botones de agregar */}
            {totalImages < 5 && (
              <>
                <TouchableOpacity style={styles.addImgBtn} onPress={pickImages}>
                  <MaterialCommunityIcons name="image-plus" size={24} color={COLORS.primary} />
                  <Text style={styles.addImgText}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addImgBtn} onPress={takePhoto}>
                  <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS.accent} />
                  <Text style={[styles.addImgText, { color: COLORS.accent }]}>Cámara</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* ── Campos ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Producto</Text>

          <TextInput
            label="Nombre del producto *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            outlineColor={errors.name ? COLORS.error : COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={styles.input}
            error={!!errors.name}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          {/* Categoría (dropdown manual) */}
          <Menu
            visible={categoryMenuOpen}
            onDismiss={() => setCategoryMenuOpen(false)}
            anchor={
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  errors.category && { borderColor: COLORS.error },
                ]}
                onPress={() => setCategoryMenuOpen(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !category && { color: COLORS.textMuted },
                  ]}
                >
                  {category || 'Seleccionar categoría *'}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            }
          >
            {CATEGORIES.map((cat) => (
              <Menu.Item
                key={cat}
                title={cat}
                onPress={() => {
                  setCategory(cat);
                  setCategoryMenuOpen(false);
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }}
              />
            ))}
          </Menu>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                label="Precio (COP) *"
                value={price}
                onChangeText={setPrice}
                mode="outlined"
                keyboardType="numeric"
                outlineColor={errors.price ? COLORS.error : COLORS.border}
                activeOutlineColor={COLORS.primary}
                left={<TextInput.Affix text="$" />}
                error={!!errors.price}
              />
              {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="Stock *"
                value={stock}
                onChangeText={setStock}
                mode="outlined"
                keyboardType="numeric"
                outlineColor={errors.stock ? COLORS.error : COLORS.border}
                activeOutlineColor={COLORS.primary}
                right={<TextInput.Affix text="uds" />}
                error={!!errors.stock}
              />
              {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
            </View>
          </View>

          <TextInput
            label="Descripción *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            outlineColor={errors.description ? COLORS.error : COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={[styles.input, { minHeight: 100 }]}
            error={!!errors.description}
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}
        </View>

        {/* ── Botones de acción ── */}
        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
            textColor={COLORS.textSecondary}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveBtn}
            buttonColor={COLORS.primary}
            contentStyle={{ height: 48 }}
            labelStyle={{ fontWeight: '700', fontSize: 15 }}
          >
            {isEditing ? 'Actualizar' : 'Crear Producto'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 40 },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },

  imagesRow: { flexDirection: 'row', marginTop: 4 },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    marginRight: 8,
    position: 'relative',
  },
  thumbImg: { width: 80, height: 80, borderRadius: RADIUS.sm },
  removeImg: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImgBtn: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    gap: 4,
  },
  addImgText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },

  input: { marginBottom: SPACING.sm, backgroundColor: COLORS.surface },
  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  halfInput: { flex: 1 },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  dropdownText: { fontSize: 14, color: COLORS.text },

  errorText: { fontSize: 12, color: COLORS.error, marginTop: -4, marginBottom: 6 },

  buttonRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  cancelBtn: { flex: 1, borderRadius: RADIUS.sm },
  saveBtn: { flex: 2, borderRadius: RADIUS.sm },
});
