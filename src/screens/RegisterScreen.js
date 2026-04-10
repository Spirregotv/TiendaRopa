import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import { useProfile } from '../context/ProfileContext';

export default function RegisterScreen({ navigation }) {
  const { registerClient } = useInventory();
  const { syncLoginEmail } = useProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (!email.includes('@')) {
      setError('Ingresa un email válido.');
      return;
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setError('');
    registerClient(name.trim(), email.trim());
    // ✅ Sincronizar datos del registro con el perfil
    syncLoginEmail(name.trim(), email.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a {APP_CONFIG.storeName} y descubre nuestra colección exclusiva
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre completo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 4 caracteres"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <Text style={styles.registerBtnText}>Registrarse</Text>
            <Ionicons name="checkmark" size={18} color={Colors.textWhite} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLinkBold}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  registerBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textWhite,
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkBold: {
    fontWeight: '600',
    color: Colors.accent,
  },
});
