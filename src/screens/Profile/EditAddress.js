import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useProfile } from '../../context/ProfileContext'; // ✅ FIX: estado compartido

const schema = yup.object().shape({
  street:  yup.string().required('La calle es obligatoria'),
  number:  yup.string().required('El número es obligatorio'),
  zipCode: yup
    .string()
    .matches(/^[0-9]+$/, 'Solo números')
    .min(5, 'CP inválido (mínimo 5 dígitos)')
    .required('CP obligatorio'),
  city:  yup.string().required('La ciudad es obligatoria'),
  state: yup.string().required('El estado es obligatorio'),
});

export default function EditAddress({ navigation }) {
  // ✅ FIX: lee del contexto para pre-poblar y para persistir los cambios
  const { profile, updateAddress } = useProfile();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    // ✅ FIX: defaultValues usa profile.address del contexto (datos actualizados),
    //         no initialUserData (que siempre era el valor original).
    defaultValues: profile.address,
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateAddress(data);
      Alert.alert('Éxito', 'Tu domicilio ha sido actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el domicilio. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Dirección de Envío</Text>

          {/* Calle */}
          <Controller control={control} name="street" render={({ field: { onChange, value } }) => (
            <TextInput
              label="Calle"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.street}
              style={styles.input}
              outlineStyle={styles.inputRadius}
              left={<TextInput.Icon icon={(props) => <MaterialCommunityIcons {...props} name="road" size={20} />} />}
            />
          )} />
          {errors.street && <Text style={styles.error}>{errors.street.message}</Text>}

          {/* Número + CP en fila */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="number" render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Número"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.number}
                  style={styles.input}
                  outlineStyle={styles.inputRadius}
                  left={<TextInput.Icon icon={(props) => <MaterialCommunityIcons {...props} name="pound" size={20} />} />}
                />
              )} />
              {errors.number && <Text style={styles.error}>{errors.number.message}</Text>}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Controller control={control} name="zipCode" render={({ field: { onChange, value } }) => (
                <TextInput
                  label="C.P."
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  maxLength={5}
                  error={!!errors.zipCode}
                  style={styles.input}
                  outlineStyle={styles.inputRadius}
                  left={<TextInput.Icon icon={(props) => <MaterialCommunityIcons {...props} name="mailbox" size={20} />} />}
                />
              )} />
              {errors.zipCode && <Text style={styles.error}>{errors.zipCode.message}</Text>}
            </View>
          </View>

          {/* Ciudad */}
          <Controller control={control} name="city" render={({ field: { onChange, value } }) => (
            <TextInput
              label="Ciudad"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.city}
              style={styles.input}
              outlineStyle={styles.inputRadius}
              left={<TextInput.Icon icon={(props) => <MaterialCommunityIcons {...props} name="city" size={20} />} />}
            />
          )} />
          {errors.city && <Text style={styles.error}>{errors.city.message}</Text>}

          {/* Estado */}
          <Controller control={control} name="state" render={({ field: { onChange, value } }) => (
            <TextInput
              label="Estado"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.state}
              style={styles.input}
              outlineStyle={styles.inputRadius}
              left={<TextInput.Icon icon={(props) => <MaterialCommunityIcons {...props} name="map" size={20} />} />}
            />
          )} />
          {errors.state && <Text style={styles.error}>{errors.state.message}</Text>}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.saveBtn}
            contentStyle={styles.btnContent}
          >
            {loading ? 'Guardando...' : 'Guardar Domicilio'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  label: {
    fontSize: 13, fontWeight: '700', color: Colors.textLight,
    textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1,
  },
  input: { marginBottom: 8, backgroundColor: Colors.surface },
  inputRadius: { borderRadius: 12 },
  error: { color: Colors.danger, fontSize: 12, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row' },
  saveBtn: {
    marginTop: 24, borderRadius: 14, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10,
  },
  btnContent: { height: 54 },
});
