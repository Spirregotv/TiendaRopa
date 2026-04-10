import React from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Title, 
  Provider as PaperProvider, 
  MD3LightTheme,
  IconButton,
  Divider,
  Surface
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

// 1. Validation Schema (Yup)
const schema = yup.object().shape({
  fullName: yup.string().required('El nombre es obligatorio'),
  email: yup.string().email('Email inválido').required('El email es obligatorio'),
  phone: yup.string()
    .matches(/^[0-9]{10}$/, 'Debe tener 10 dígitos')
    .required('El teléfono es obligatorio'),
  street: yup.string().required('La calle es obligatoria'),
  number: yup.string().required('El número es obligatorio'),
  zipCode: yup.string()
    .matches(/^[0-9]+$/, 'Solo números')
    .min(5, 'CP inválido')
    .required('CP obligatorio'),
  city: yup.string().required('La ciudad es obligatoria'),
  state: yup.string().required('El estado es obligatorio'),
});

// 2. Custom Paper Theme using project Colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    onPrimary: Colors.surface,
    secondaryContainer: Colors.accentLight,
    onSecondaryContainer: Colors.primary,
    outline: Colors.border,
    surface: Colors.surface,
    background: Colors.background,
  },
};

export default function UserProfileScreen({ navigation }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: 'Martín Pérez',
      email: 'martin@example.com',
      phone: '5512345678',
      street: 'Av. Insurgentes Sur',
      number: '1234',
      zipCode: '03100',
      city: 'CDMX',
      state: 'Ciudad de México',
    }
  });



  const onSubmit = (data) => {
    Alert.alert('Cambios Guardados', JSON.stringify(data, null, 2));
  };

  const renderEditableInput = (name, label, icon, keyboard = 'default') => (
    <View style={styles.inputWrapper}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={label}
            mode="outlined"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType={keyboard}
            error={!!errors[name]}
            left={<TextInput.Icon icon={() => <Ionicons name={icon} size={20} color={Colors.textSecondary} />} />}
            style={styles.input}
            outlineStyle={{ borderRadius: 12 }}
          />
        )}
      />
      {errors[name] && <Text style={styles.errorText}>{errors[name].message}</Text>}
    </View>
  );

  return (
    <PaperProvider theme={theme}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <Surface style={styles.header} elevation={1}>
          <Title style={styles.headerTitle}>Perfil de Usuario</Title>
          <Text style={styles.headerSubtitle}>Administra tu información y métodos de pago</Text>
        </Surface>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Section: Basic Data */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Datos Básicos</Text>
            </View>
            {renderEditableInput('fullName', 'Nombre Completo', 'person-outline')}
            {renderEditableInput('email', 'Correo Electrónico', 'mail-outline', 'email-address')}
            {renderEditableInput('phone', 'Teléfono', 'call-outline', 'phone-pad')}
          </View>

          <Divider style={styles.divider} />

          {/* Section: Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Domicilio</Text>
            </View>
            {renderEditableInput('street', 'Calle', 'map-outline')}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>{renderEditableInput('number', 'Num.', 'hash-outline')}</View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>{renderEditableInput('zipCode', 'CP', 'pin-outline', 'numeric')}</View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>{renderEditableInput('city', 'Ciudad', 'business-outline')}</View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>{renderEditableInput('state', 'Estado', 'earth-outline')}</View>
            </View>
          </View>



          {/* Action Button */}
          <Button 
            mode="contained" 
            onPress={handleSubmit(onSubmit)} 
            style={styles.saveBtn}
            contentStyle={{ height: 54 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
          >
            Guardar Cambios
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { marginBottom: 12 },
  input: { backgroundColor: Colors.surface },
  errorText: { color: Colors.danger, fontSize: 11, marginTop: 4, marginLeft: 12 },
  row: { flexDirection: 'row' },
  divider: { marginVertical: 10, opacity: 0.5 },

  saveBtn: { marginTop: 20, borderRadius: 16, elevation: 2 },
});
