import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, storage } from '../../config/firebase';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 2 - SPACING.sm) / 2;

// ─── Tarjeta de producto ───────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }) {
  const stockColor =
    product.stock === 0
      ? COLORS.error
      : product.stock <= 5
      ? COLORS.warning
      : COLORS.success;

  return (
    <View style={styles.card}>
      {/* Imagen */}
      <TouchableOpacity onPress={() => onEdit(product)} activeOpacity={0.85}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <MaterialCommunityIcons name="image-off-outline" size={32} color={COLORS.textMuted} />
          </View>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.cardCategory}>{product.category}</Text>
        <Text style={styles.cardPrice}>${product.price?.toLocaleString('es-CO')}</Text>

        {/* Stock badge */}
        <View style={[styles.stockBadge, { backgroundColor: `${stockColor}22` }]}>
          <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
          <Text style={[styles.stockText, { color: stockColor }]}>
            {product.stock === 0 ? 'Sin stock' : `${product.stock} uds.`}
          </Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(product)}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(product)}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Listener en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(data);
    });
    return unsub;
  }, []);

  // Filtrado por búsqueda
  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter(
          (p) =>
            p.name?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term)
        )
      );
    }
  }, [products, search]);

  const handleEdit = (product) => {
    navigation.navigate('ProductForm', { product });
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Eliminar imágenes del Storage
              const deleteImgPromises = (product.images ?? []).map(async (url) => {
                try {
                  // Extraer path desde la URL de Storage
                  const path = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] ?? '');
                  if (path) {
                    await deleteObject(ref(storage, path));
                  }
                } catch {
                  // Ignorar errores de imagen (puede que ya no exista)
                }
              });
              await Promise.all(deleteImgPromises);

              // Eliminar documento
              await deleteDoc(doc(db, 'products', product.id));
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el producto.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={styles.root}>
      <LoadingOverlay visible={loading} message="Eliminando producto..." />

      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o categoría..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Contador */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="hanger" size={52} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin productos</Text>
            <Text style={styles.emptyText}>
              {search
                ? 'No se encontraron productos con ese término.'
                : 'Toca el botón + para agregar tu primer producto.'}
            </Text>
          </View>
        }
      />

      {/* FAB para agregar */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('ProductForm', {})}
        label="Agregar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    marginBottom: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  countRow: { paddingHorizontal: SPACING.md, paddingVertical: 8 },
  countText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  listContent: { padding: SPACING.md, paddingBottom: 96 },
  row: { justifyContent: 'space-between', marginBottom: SPACING.sm },

  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  noImage: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: SPACING.sm },
  cardName: { fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 18 },
  cardCategory: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
    gap: 4,
  },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  deleteBtn: {
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
  },
});
