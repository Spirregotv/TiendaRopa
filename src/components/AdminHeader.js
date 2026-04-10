import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';

export default function AdminHeader({ onLogout }) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.textWhite} />
          <Text style={styles.adminText}>ADMIN</Text>
        </View>
        <Text style={styles.storeName}>{APP_CONFIG.storeName}</Text>
      </View>
      {onLogout && (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  adminText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
});
