import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';

const { width } = Dimensions.get('window');
const THUMB_SIZE = 56;

// Amazon-inspired colors (brand-neutral)
const AZ = {
  orange: '#FF9900',
  yellow: '#FFD814',
  yellowBorder: '#C89411',
  teal: '#007185',
  tealDark: '#004F5D',
  bestsellerOrange: '#E47911',
  starGold: '#FFA41C',
  greenDeal: '#067D62',
  link: '#007185',
};

export default function ProductDetailScreen({ route, navigation }) {
  const { addToCart, cartDetails, getStockForSize } = useInventory();
  const item = route.params.item;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const gallery = (item.gallery && item.gallery.length > 0) ? item.gallery : [item.imageUrl].filter(Boolean);
  const tallasDisponibles = item.tallasDisponibles || [item.talla];
  const freeShipping = item.precioVenta >= APP_CONFIG.freeShippingMin;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    for (let i = 0; i < quantity; i++) {
      addToCart(item.id, selectedSize);
    }
    Alert.alert(
      'Agregado al carrito',
      `${item.nombre} (Talla ${selectedSize}) × ${quantity} se agregó a tu carrito.`,
      [
        { text: 'Seguir comprando', style: 'cancel' },
        {
          text: 'Ver carrito',
          onPress: () => navigation.navigate('ClientTabs', { screen: 'Carrito' }),
        },
      ]
    );
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    for (let i = 0; i < quantity; i++) {
      addToCart(item.id, selectedSize);
    }
    navigation.navigate('Checkout');
  };

  const selectSize = (size) => {
    setSelectedSize(size);
    setSizeError(false);
  };

  // Delivery date estimate
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (freeShipping ? 1 : 3));
  const deliveryStr = deliveryDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>{APP_CONFIG.storeName}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrito' })}
        >
          <Ionicons name="cart-outline" size={24} color={Colors.textPrimary} />
          {cartDetails.cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartDetails.cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.gallerySection}>
          {/* Thumbnails column */}
          <View style={styles.thumbColumn}>
            {gallery.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumb,
                  activeImageIndex === idx && styles.thumbActive,
                ]}
                onPress={() => setActiveImageIndex(idx)}
              >
                <Image
                  source={{ uri: img }}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Main image */}
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: gallery[activeImageIndex] }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            {item.bestseller && (
              <View style={styles.bestsellerBadge}>
                <Ionicons name="trophy" size={12} color="#FFF" />
                <Text style={styles.bestsellerText}>Más vendido #1</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product info */}
        <View style={styles.infoSection}>
          {/* Brand */}
          <Text style={styles.brand}>{item.marca || 'MAISON'}</Text>

          {/* Title */}
          <Text style={styles.title}>{item.nombre}</Text>

          {/* Gender badge */}
          <View style={styles.genderBadge}>
            <Ionicons
              name={item.gender === 'hombre' ? 'man' : item.gender === 'mujer' ? 'woman' : 'people'}
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.genderText}>
              {item.gender === 'hombre' ? 'Hombre' : item.gender === 'mujer' ? 'Mujer' : 'Unisex'}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= 4 ? 'star' : 'star-half'}
                size={16}
                color={AZ.starGold}
              />
            ))}
            <Text style={styles.ratingText}>4.5</Text>
            <Text style={styles.reviewCount}>128 calificaciones</Text>
          </View>

          <View style={styles.divider} />

          {/* Price block */}
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>{APP_CONFIG.currency}</Text>
              <Text style={styles.priceAmount}>
                {item.precioVenta.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <Text style={styles.msiText}>
              Hasta 12 meses sin intereses
            </Text>
          </View>

          {/* Delivery info (conditional on >$999) */}
          {freeShipping ? (
            <View style={styles.shippingRow}>
              <View style={styles.shippingBadge}>
                <Ionicons name="flash" size={12} color="#FFF" />
                <Text style={styles.shippingBadgeText}>EXPRESS</Text>
              </View>
              <View style={styles.shippingInfo}>
                <Text style={styles.deliveryFree}>
                  Entrega GRATUITA
                </Text>
                <Text style={styles.deliveryDate}>
                  Llega el{' '}
                  <Text style={styles.deliveryDateBold}>{deliveryStr}</Text>
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.shippingRow}>
              <Ionicons name="bicycle-outline" size={18} color={Colors.textSecondary} />
              <View style={styles.shippingInfo}>
                <Text style={styles.deliveryStd}>
                  Envío estándar — Llega el{' '}
                  <Text style={styles.deliveryDateBold}>{deliveryStr}</Text>
                </Text>
                <Text style={styles.freeShipHint}>
                  Envío gratis en compras mayores a ${APP_CONFIG.freeShippingMin}
                </Text>
              </View>
            </View>
          )}

          {/* Stock */}
          <Text
            style={[
              styles.stockText,
              item.stock <= 3 && styles.stockLow,
            ]}
          >
            {item.stock <= 3
              ? `¡Solo quedan ${item.stock} en stock!`
              : 'En stock'}
          </Text>

          <View style={styles.divider} />

          {/* Size selector */}
          <View style={styles.sizeSection}>
            <Text style={styles.sizeLabel}>
              Talla:{' '}
              <Text style={styles.sizeSelected}>
                {selectedSize || 'Selecciona'}
              </Text>
            </Text>

            <View
              style={[
                styles.sizeGrid,
                sizeError && styles.sizeGridError,
              ]}
            >
              {tallasDisponibles.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBtn,
                    selectedSize === size && styles.sizeBtnActive,
                  ]}
                  onPress={() => selectSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeBtnText,
                      selectedSize === size && styles.sizeBtnTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {sizeError && (
              <View style={styles.sizeErrorRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.sizeErrorText}>
                  Por favor, elige una talla
                </Text>
              </View>
            )}
          </View>

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Cantidad:</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={16} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.min(selectedSize ? getStockForSize(item.id, selectedSize) : item.stock, quantity + 1))}
              >
                <Ionicons name="add" size={16} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={18} color="#111" />
            <Text style={styles.addToCartText}>Añadir al carrito</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
            <Text style={styles.buyNowText}>Comprar ahora</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Acerca de este artículo</Text>
            <Text style={styles.descText}>
              {item.descripcion || 'Prenda de alta calidad confeccionada con los mejores materiales.'}
            </Text>
          </View>

          {/* Details table */}
          <View style={styles.detailsTable}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Marca</Text>
              <Text style={styles.detailValue}>{item.marca || 'MAISON'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Género</Text>
              <Text style={styles.detailValue}>
                {item.gender === 'hombre' ? 'Hombre' : item.gender === 'mujer' ? 'Mujer' : 'Unisex'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tallas disponibles</Text>
              <Text style={styles.detailValue}>
                {tallasDisponibles.join(', ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Disponibilidad</Text>
              <Text style={[styles.detailValue, { color: Colors.success }]}>
                {item.stock} unidades
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 10,
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
  headerCenter: { alignItems: 'center' },
  headerBrand: {
    fontSize: 18,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: AZ.orange,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },

  // Gallery
  gallerySection: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
  },
  thumbColumn: { width: THUMB_SIZE + 8, gap: 8, paddingRight: 8 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbActive: { borderColor: AZ.teal },
  thumbImage: { width: '100%', height: '100%' },
  mainImageContainer: {
    flex: 1,
    aspectRatio: 3 / 4,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  bestsellerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AZ.bestsellerOrange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 4,
  },
  bestsellerText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Info
  infoSection: { padding: 16, gap: 10 },
  brand: { fontSize: 14, color: AZ.link, fontWeight: '400' },
  title: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: AZ.link, fontWeight: '600', marginLeft: 4 },
  reviewCount: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },

  // Price
  priceBlock: { gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  priceCurrency: { fontSize: 14, fontWeight: '400', color: Colors.textPrimary, marginTop: 4 },
  priceAmount: { fontSize: 32, fontWeight: '400', color: Colors.textPrimary, letterSpacing: -0.5 },
  msiText: { fontSize: 13, color: AZ.greenDeal, fontWeight: '500' },

  // Shipping
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  shippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AZ.greenDeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  shippingBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  shippingInfo: { flex: 1 },
  deliveryFree: { fontSize: 13, fontWeight: '700', color: AZ.greenDeal },
  deliveryStd: { fontSize: 13, color: Colors.textPrimary },
  deliveryDate: { fontSize: 12, color: Colors.textSecondary },
  deliveryDateBold: { fontWeight: '700', color: Colors.textPrimary },
  freeShipHint: { fontSize: 11, color: Colors.textLight, marginTop: 2 },

  // Stock
  stockText: { fontSize: 14, fontWeight: '500', color: Colors.success },
  stockLow: { color: Colors.danger },

  // Size selector
  sizeSection: { gap: 8 },
  sizeLabel: { fontSize: 14, fontWeight: '400', color: Colors.textPrimary },
  sizeSelected: { fontWeight: '600' },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeGridError: {
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: 8,
    backgroundColor: Colors.dangerLight,
  },
  sizeBtn: {
    minWidth: 52,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
  },
  sizeBtnActive: { borderColor: AZ.teal, borderWidth: 2, backgroundColor: '#E0F5F5' },
  sizeBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  sizeBtnTextActive: { color: AZ.tealDark, fontWeight: '700' },
  sizeErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sizeErrorText: { fontSize: 13, color: Colors.danger, fontWeight: '500' },

  // Quantity
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  qtyLabel: { fontSize: 14, color: Colors.textPrimary },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  qtyValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },

  // Action buttons
  addToCartBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AZ.yellow,
    borderRadius: 24,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: AZ.yellowBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartText: { fontSize: 15, fontWeight: '600', color: '#111' },
  buyNowBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AZ.orange,
    borderRadius: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buyNowText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  // Description
  descSection: { gap: 6 },
  descTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Details table
  detailsTable: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  detailValue: { flex: 1, fontSize: 13, color: Colors.textPrimary },
});
