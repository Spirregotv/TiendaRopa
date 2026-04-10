import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useProfile } from '../../context/ProfileContext';

// ─── Validación ───────────────────────────────────────────────────────────────
const schema = yup.object().shape({
  holder: yup
    .string()
    .required('El nombre del titular es obligatorio')
    .min(3, 'Mínimo 3 caracteres'),
  cardNumber: yup
    .string()
    .test('len', 'El número de tarjeta debe tener 16 dígitos', (val) => {
      const digits = (val || '').replace(/\s/g, '');
      return digits.length === 16;
    })
    .required('El número de tarjeta es obligatorio'),
  exp: yup
    .string()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Formato inválido. Usa MM/AA (ej: 08/26)')
    .required('La fecha de expiración es obligatoria')
    .test('not-expired', 'La tarjeta ha expirado', (value) => {
      if (!value || !value.includes('/')) return false;
      const [mm, yy] = value.split('/');
      const expDate = new Date(2000 + parseInt(yy, 10), parseInt(mm, 10) - 1, 1);
      const today = new Date();
      return expDate >= new Date(today.getFullYear(), today.getMonth(), 1);
    }),
  cvv: yup
    .string()
    .matches(/^[0-9]{3,4}$/, 'CVV inválido (3 o 4 dígitos)')
    .required('El CVV es obligatorio'),
  type: yup
    .string()
    .required('El tipo de tarjeta es obligatorio'),
});

// ─── Formateadores ────────────────────────────────────────────────────────────
const formatCardNumber = (text) => {
  const digits = text.replace(/\D/g, '').substring(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExp = (text) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
};

// Formatea para mostrar en la vista previa: grupos de 4
const displayCardNumber = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '');
  if (!digits) return '•••• •••• •••• ••••';
  const padded = digits.padEnd(16, '•');
  return padded.replace(/(.{4})/g, '$1 ').trim();
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function CardDetail({ route, navigation }) {
  const { card } = route.params;
  const isNew = card === null;

  const { updateCard, addCard, deleteCard } = useProfile();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      holder:     card?.holder     ?? '',
      cardNumber: card?.cardNumber ? formatCardNumber(card.cardNumber) : '',
      exp:        card?.exp        ?? '',
      cvv:        card?.cvv        ?? '',
      type:       card?.type       ?? 'Visa',
    },
  });

  const watchedType   = watch('type');
  const watchedNumber = watch('cardNumber');

  const previewColor = watchedType === 'MasterCard' ? '#333333'
    : watchedType === 'Amex' ? '#2E77BC'
    : '#1A1F71';

  const onSubmit = async (data) => {
    const cleanNumber = data.cardNumber.replace(/\s/g, '');
    setLoading(true);
    try {
      if (isNew) {
        await addCard({
          holder:     data.holder.toUpperCase(),
          cardNumber: cleanNumber,
          exp:        data.exp,
          cvv:        data.cvv,
          type:       data.type,
          color:      previewColor,
        });
        Alert.alert('Tarjeta Agregada', 'Tu nueva tarjeta ha sido guardada.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await updateCard({
          id:         card.id,
          holder:     data.holder.toUpperCase(),
          cardNumber: cleanNumber,
          exp:        data.exp,
          cvv:        data.cvv,
          type:       data.type,
          color:      previewColor,
        });
        Alert.alert('Tarjeta Actualizada', 'Los cambios han sido guardados.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la tarjeta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const last4 = card?.cardNumber?.slice(-4) ?? '????';
    Alert.alert(
      'Eliminar Tarjeta',
      `¿Estás seguro de que deseas eliminar la tarjeta terminada en ${last4}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteCard(card.id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la tarjeta.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Vista previa de la tarjeta */}
          <View style={[styles.visualCard, { backgroundColor: previewColor }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>{watchedType}</Text>
              <MaterialCommunityIcons name="contactless-payment" size={32} color="#FFF" />
            </View>
            <Text style={styles.cardNumber}>
              {displayCardNumber(watchedNumber)}
            </Text>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>Titular</Text>
                <Text style={styles.cardValue}>{watch('holder') || 'NOMBRE APELLIDO'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardLabel}>Expira</Text>
                <Text style={styles.cardValue}>{watch('exp') || 'MM/AA'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>
            {isNew ? 'Nueva Tarjeta' : 'Editar Tarjeta'}
          </Text>

          {/* Tipo de tarjeta */}
          <Controller control={control} name="type" render={({ field: { onChange, value } }) => (
            <TextInput
              label="Tipo (Visa / MasterCard / Amex)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.type}
              style={styles.input}
              outlineStyle={styles.radius}
              left={<TextInput.Icon icon={(p) => <MaterialCommunityIcons {...p} name="credit-card-outline" size={20} />} />}
            />
          )} />
          {errors.type && <Text style={styles.error}>{errors.type.message}</Text>}

          {/* Nombre del titular */}
          <Controller control={control} name="holder" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Nombre del Titular"
              mode="outlined"
              value={value}
              onBlur={onBlur}
              onChangeText={(t) => onChange(t.toUpperCase())}
              autoCapitalize="characters"
              error={!!errors.holder}
              style={styles.input}
              outlineStyle={styles.radius}
              left={<TextInput.Icon icon={(p) => <MaterialCommunityIcons {...p} name="account-outline" size={20} />} />}
            />
          )} />
          {errors.holder && <Text style={styles.error}>{errors.holder.message}</Text>}

          {/* Número completo de tarjeta */}
          <Controller control={control} name="cardNumber" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Número de Tarjeta (16 dígitos)"
              mode="outlined"
              value={value}
              onBlur={onBlur}
              onChangeText={(t) => onChange(formatCardNumber(t))}
              keyboardType="numeric"
              maxLength={19}
              error={!!errors.cardNumber}
              style={styles.input}
              outlineStyle={styles.radius}
              left={<TextInput.Icon icon={(p) => <MaterialCommunityIcons {...p} name="credit-card" size={20} />} />}
            />
          )} />
          {errors.cardNumber && <Text style={styles.error}>{errors.cardNumber.message}</Text>}

          {/* Expiración + CVV en fila */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="exp" render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Expiración (MM/AA)"
                  mode="outlined"
                  value={value}
                  onChangeText={(t) => onChange(formatExp(t))}
                  keyboardType="numeric"
                  maxLength={5}
                  error={!!errors.exp}
                  style={styles.input}
                  outlineStyle={styles.radius}
                  left={<TextInput.Icon icon={(p) => <MaterialCommunityIcons {...p} name="calendar-outline" size={20} />} />}
                />
              )} />
              {errors.exp && <Text style={styles.error}>{errors.exp.message}</Text>}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Controller control={control} name="cvv" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="CVV"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                  error={!!errors.cvv}
                  style={styles.input}
                  outlineStyle={styles.radius}
                  left={<TextInput.Icon icon={(p) => <MaterialCommunityIcons {...p} name="lock-outline" size={20} />} />}
                />
              )} />
              {errors.cvv && <Text style={styles.error}>{errors.cvv.message}</Text>}
            </View>
          </View>

          {/* Botones */}
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.saveBtn}
            contentStyle={styles.btnContent}
          >
            {loading ? 'Guardando...' : isNew ? 'Agregar Tarjeta' : 'Guardar Cambios'}
          </Button>

          {!isNew && (
            <Button
              mode="outlined"
              onPress={handleDelete}
              disabled={loading}
              style={styles.deleteBtn}
              contentStyle={styles.btnContent}
              textColor={Colors.danger}
            >
              Eliminar Tarjeta
            </Button>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  visualCard: {
    borderRadius: 24, padding: 28, height: 220,
    justifyContent: 'space-between', elevation: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
    marginBottom: 32,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { color: '#FFF', fontSize: 26, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  cardNumber: { color: '#FFF', fontSize: 20, letterSpacing: 4, textAlign: 'center', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 2 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.textLight,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
  },
  input: { marginBottom: 8, backgroundColor: Colors.surface },
  radius: { borderRadius: 12 },
  error: { color: Colors.danger, fontSize: 12, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row' },

  saveBtn: {
    marginTop: 20, borderRadius: 14, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  deleteBtn: {
    marginTop: 12, borderRadius: 14,
    borderColor: Colors.danger, borderWidth: 1.5,
  },
  btnContent: { height: 52 },
});
