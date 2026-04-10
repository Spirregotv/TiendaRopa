import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useProfile } from '../../context/ProfileContext'; // ✅ FIX: estado compartido

const formatDisplay = (cardNumber) => {
  if (!cardNumber) return '';
  return cardNumber.replace(/(.{4})/g, '$1 ').trim();
};

const CreditCard = ({ card, onPress }) => (
  <TouchableOpacity style={[styles.card, { backgroundColor: card.color }]} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardType}>{card.type}</Text>
      <MaterialCommunityIcons
        name="wifi"
        size={24}
        color="#FFF"
        style={{ transform: [{ rotate: '90deg' }] }}
      />
    </View>
    <Text style={styles.cardNumber}>{formatDisplay(card.cardNumber)}</Text>
    <View style={styles.cardFooter}>
      <Text style={styles.cardHolder}>{card.holder}</Text>
      <Text style={styles.cardExp}>{card.exp}</Text>
    </View>
  </TouchableOpacity>
);

export default function Payments({ navigation }) {
  // ✅ FIX: Lee las tarjetas del contexto reactivo, no del objeto estático.
  //         Si se agrega/edita/elimina una tarjeta, esta lista se actualiza sola.
  const { profile } = useProfile();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Tus Tarjetas Guardadas</Text>

        {profile.paymentMethods.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No tienes tarjetas guardadas</Text>
          </View>
        )}

        {profile.paymentMethods.map((card) => (
          <CreditCard
            key={card.id}
            card={card}
            onPress={() => navigation.navigate('CardDetail', { card })}
          />
        ))}

        {/* ✅ FIX: El botón de agregar ahora navega a CardDetail en modo "nuevo" */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CardDetail', { card: null })}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addBtnText}>Agregar nuevo método de pago</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  label: {
    fontSize: 13, fontWeight: '700', color: Colors.textLight,
    textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1,
  },
  card: {
    borderRadius: 20, padding: 24, marginBottom: 20, height: 200,
    justifyContent: 'space-between', elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { color: '#FFF', fontSize: 22, fontWeight: '800', fontStyle: 'italic', letterSpacing: 1 },
  cardNumber: { color: '#FFF', fontSize: 24, letterSpacing: 4, marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardHolder: { color: '#FFF', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  cardExp: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 18, borderRadius: 16, borderStyle: 'dashed',
    borderWidth: 2, borderColor: Colors.border, marginTop: 10,
  },
  addBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
