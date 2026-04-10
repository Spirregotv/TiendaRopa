import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';

export default function ProductCard({ item, onAddToCart, onPress, cardWidth }) {
  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.8}
      onPress={() => onPress && onPress(item)}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Add to cart overlay */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            onAddToCart(item.id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={Colors.textWhite} />
        </TouchableOpacity>
        {/* Bestseller badge */}
        {item.bestseller && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.bestsellerText}>#1</Text>
          </View>
        )}
        {/* Out of stock overlay */}
        {item.stock <= 0 && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {item.nombre}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={styles.price}>
            {APP_CONFIG.currency}{item.precioVenta.toLocaleString()}
          </Text>
          <Text style={styles.talla}>Talla {item.talla}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  addBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bestsellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E47911',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bestsellerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  outOfStock: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  talla: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
