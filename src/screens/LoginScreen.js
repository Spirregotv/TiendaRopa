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
import { ADMIN_CREDENTIALS, APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import { useProfile } from '../context/ProfileContext';

export default function LoginScreen({ navigation }) {
  const { loginAsAdmin, loginAsClient } = useInventory();
  const { syncLoginEmail } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    // Check admin credentials
    if (
      email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setError('');
      loginAsAdmin();
      return;
    }

    // Any other credentials → client login
    if (email.includes('@') && password.length >= 4) {
      setError('');
      const clientName = email.split('@')[0];
      loginAsClient(clientName, email.trim());
      // ✅ Sincronizar email del login con el perfil del usuario
      syncLoginEmail(clientName, email.trim());
      return;
    }

    setError('Credenciales inválidas. Verifica tu email y contraseña.');
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
        {/* Hero branding */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="diamond-outline" size={40} color={Colors.accent} />
          </View>
          <Text style={styles.brand}>{APP_CONFIG.storeName}</Text>
          <Text style={styles.tagline}>{APP_CONFIG.storeTagline}</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.welcomeText}>
            Bienvenido de vuelta
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.textLight}
              />
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña"
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

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textWhite} />
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerBtnText}>Crear Cuenta Nueva</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.accentLight,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  brand: {
    fontSize: 32,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  heroDivider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.accent,
    marginTop: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '300',
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
  loginBtn: {
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
  loginBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textWhite,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  registerBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
});
