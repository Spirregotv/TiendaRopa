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
  fullName: yup.string().required('El nombre es obligatorio'),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos numéricos')
    .required('El teléfono es obligatorio'),
});

export default function EditPersonal({ navigation }) {
  // ✅ FIX: Extraemos profile del contexto para pre-poblar el formulario
  //         y updatePersonal para persistir los cambios en el estado global.
  const { profile, updatePersonal } = useProfile();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      // ✅ FIX: defaultValues usa los datos del contexto, no los del archivo estático.
      //         Si el usuario ya editó antes, el formulario cargará esos valores.
      fullName: profile.fullName,
      phone:    profile.phone,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // ✅ FIX: Llamamos a updatePersonal que actualiza el estado global.
      //         Al hacer navigation.goBack(), Overview se re-renderiza con los nuevos datos.
      await updatePersonal(data);
      Alert.alert('Éxito', 'Tus datos personales han sido actualizados.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
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
          <Text style={styles.label}>Información Básica</Text>

          {/* Campo: Nombre */}
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Nombre Completo"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.fullName}
                style={styles.input}
                outlineStyle={{ borderRadius: 12 }}
                left={
                  <TextInput.Icon
                    icon={(props) => <MaterialCommunityIcons {...props} name="account-outline" size={20} />}
                  />
                }
              />
            )}
          />
          {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}

          {/* Campo: Teléfono */}
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Teléfono (10 dígitos)"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="phone-pad"
                maxLength={10}
                error={!!errors.phone}
                style={styles.input}
                outlineStyle={{ borderRadius: 12 }}
                left={
                  <TextInput.Icon
                    icon={(props) => <MaterialCommunityIcons {...props} name="phone-outline" size={20} />}
                  />
                }
              />
            )}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

          {/* Email fijo — no editable */}
          <Text style={styles.fixedInfo}>📧  {profile.email} (No editable)</Text>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.saveBtn}
            contentStyle={styles.btnContent}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
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
  error: { color: Colors.danger, fontSize: 12, marginBottom: 12, marginLeft: 4 },
  fixedInfo: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, fontStyle: 'italic' },
  saveBtn: {
    marginTop: 30, borderRadius: 14, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  btnContent: { height: 52 },
});
