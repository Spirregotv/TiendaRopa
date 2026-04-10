import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  PROFILE:          '@tienda_user_profile',
  SHIPPING_ADDRESS: '@tienda_shipping_address',
  HAS_PURCHASED:    '@tienda_has_purchased',
};

/**
 * useUserData — Hook personalizado para gestionar la carga y guardado
 * de datos de usuario (perfil, dirección, historial de compra) en AsyncStorage
 * con sincronización hacia el Context API.
 *
 * Responsabilidades:
 * - Carga datos guardados al montar (hidratación)
 * - Persiste cambios en AsyncStorage cada vez que se llama a save*
 * - Expone `hasPurchased` para saber si ya compró antes
 * - Expone `isHydrated` para saber si ya terminó de cargar desde disco
 */
export default function useUserData() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Cached data from AsyncStorage
  const [savedProfile, setSavedProfile] = useState(null);
  const [savedShippingAddress, setSavedShippingAddress] = useState(null);

  // Avoid double-hydration in StrictMode
  const hydrated = useRef(false);

  // ─── Hydrate: cargar de AsyncStorage al montar ────────────────────────────
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    (async () => {
      try {
        const [profileJson, addressJson, purchasedFlag] = await AsyncStorage.multiGet([
          STORAGE_KEYS.PROFILE,
          STORAGE_KEYS.SHIPPING_ADDRESS,
          STORAGE_KEYS.HAS_PURCHASED,
        ]);

        if (profileJson[1]) {
          setSavedProfile(JSON.parse(profileJson[1]));
        }
        if (addressJson[1]) {
          setSavedShippingAddress(JSON.parse(addressJson[1]));
        }
        if (purchasedFlag[1] === 'true') {
          setHasPurchased(true);
        }
      } catch (e) {
        console.warn('[useUserData] Error loading stored data:', e);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // ─── Save profile (fullName, phone, email) ────────────────────────────────
  const saveProfile = useCallback(async (profileData) => {
    try {
      const payload = {
        fullName: profileData.fullName,
        phone:    profileData.phone,
        email:    profileData.email,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(payload));
      setSavedProfile(payload);
    } catch (e) {
      console.warn('[useUserData] Error saving profile:', e);
      throw e;
    }
  }, []);

  // ─── Save shipping address ────────────────────────────────────────────────
  const saveShippingAddress = useCallback(async (addressData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHIPPING_ADDRESS, JSON.stringify(addressData));
      setSavedShippingAddress(addressData);
    } catch (e) {
      console.warn('[useUserData] Error saving address:', e);
      throw e;
    }
  }, []);

  // ─── Mark that user has completed at least one purchase ───────────────────
  const markPurchased = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_PURCHASED, 'true');
      setHasPurchased(true);
    } catch (e) {
      console.warn('[useUserData] Error marking purchased:', e);
    }
  }, []);

  /**
   * handleSaveData — Se dispara al confirmar la compra.
   * Persiste dirección + datos del perfil en AsyncStorage y marca como comprado.
   *
   * @param {object} opts
   * @param {object} opts.address   — Dirección del checkout (calle, numero, etc.)
   * @param {object} opts.profile   — Datos personales { fullName, phone, email }
   */
  const handleSaveData = useCallback(async ({ address, profile }) => {
    try {
      const operations = [
        [STORAGE_KEYS.HAS_PURCHASED, 'true'],
      ];

      if (address) {
        operations.push([STORAGE_KEYS.SHIPPING_ADDRESS, JSON.stringify(address)]);
        setSavedShippingAddress(address);
      }
      if (profile) {
        const payload = {
          fullName: profile.fullName,
          phone:    profile.phone,
          email:    profile.email,
        };
        operations.push([STORAGE_KEYS.PROFILE, JSON.stringify(payload)]);
        setSavedProfile(payload);
      }

      await AsyncStorage.multiSet(operations);
      setHasPurchased(true);
    } catch (e) {
      console.warn('[useUserData] Error in handleSaveData:', e);
      throw e;
    }
  }, []);

  // ─── Clear all stored data (for logout) ──────────────────────────────────
  const clearUserData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROFILE,
        STORAGE_KEYS.SHIPPING_ADDRESS,
        STORAGE_KEYS.HAS_PURCHASED,
      ]);
      setSavedProfile(null);
      setSavedShippingAddress(null);
      setHasPurchased(false);
    } catch (e) {
      console.warn('[useUserData] Error clearing data:', e);
    }
  }, []);

  return {
    // State
    isHydrated,
    hasPurchased,
    savedProfile,
    savedShippingAddress,

    // Actions
    saveProfile,
    saveShippingAddress,
    markPurchased,
    handleSaveData,
    clearUserData,
  };
}
