import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG, CATEGORIES } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const PADDING = 16;
const CARD_WIDTH = (width - PADDING * 2 - CARD_GAP) / 2;

export default function StoreScreen({ navigation }) {
  const { items, addToCart, cartDetails, getStockForSize } = useInventory();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Quick-add inteligente: si solo hay UNA talla con stock, agrega directo.
  // Si hay varias tallas disponibles, manda al detalle para que el usuario elija.
  const handleQuickAdd = (item) => {
    const sizesWithStock = (item.tallasDisponibles || []).filter(
      (t) => getStockForSize(item.id, t) > 0
    );
    if (sizesWithStock.length === 1) {
      addToCart(item.id, sizesWithStock[0]);
    } else {
      navigation.navigate('ProductDetail', { item });
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => item.stock > 0);

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.gender === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nombre.toLowerCase().includes(q) ||
          item.talla?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  const renderHeader = () => (
    <View>
      {/* Search bar (collapsible) */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar prendas..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={
                selectedCategory === item.id
                  ? Colors.textWhite
                  : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filteredItems.length} producto{filteredItems.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons
            name={showSearch ? 'close-outline' : 'search-outline'}
            size={22}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>{APP_CONFIG.storeName}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Carrito')}
        >
          <Ionicons name="bag-outline" size={22} color={Colors.textPrimary} />
          {cartDetails.cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartDetails.cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onAddToCart={handleQuickAdd}
            onPress={(product) =>
              navigation.navigate('ProductDetail', { item: product })
            }
            cardWidth={CARD_WIDTH}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shirt-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>
              No hay productos disponibles
            </Text>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 22,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 6,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: Colors.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: PADDING,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  categoriesContainer: {
    paddingHorizontal: PADDING,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.textWhite,
  },
  resultsCount: {
    fontSize: 12,
    color: Colors.textLight,
    paddingHorizontal: PADDING,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
  },
  gridContent: {
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
});
