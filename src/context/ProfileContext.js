import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialUserData } from '../screens/Profile/initialData';

// ─── Storage keys ───────────────────────────────────────────────────────────
const KEYS = {
  FULL_PROFILE:     '@tienda_full_profile',
  SHIPPING_ADDRESS: '@tienda_shipping_address',
  HAS_PURCHASED:    '@tienda_has_purchased',
};

// ─── Context ────────────────────────────────────────────────────────────────
const ProfileContext = createContext(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(initialUserData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [savedShippingAddress, setSavedShippingAddress] = useState(null);

  // Ref para acceso estable desde callbacks
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // ─── Hydrate: cargar datos del disco al montar ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const results = await AsyncStorage.multiGet([
          KEYS.FULL_PROFILE,
          KEYS.SHIPPING_ADDRESS,
          KEYS.HAS_PURCHASED,
        ]);
        const storedProfile   = results[0][1];
        const storedAddress   = results[1][1];
        const storedPurchased = results[2][1];

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setProfile(parsed);
          profileRef.current = parsed;
        }
        if (storedAddress) {
          setSavedShippingAddress(JSON.parse(storedAddress));
        }
        if (storedPurchased === 'true') {
          setHasPurchased(true);
        }
      } catch (e) {
        console.warn('[ProfileContext] hydrate error:', e);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // ─── Persist helper ──────────────────────────────────────────────────────
  const persistProfile = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(KEYS.FULL_PROFILE, JSON.stringify(data));
    } catch (e) {
      console.warn('[ProfileContext] persist error:', e);
    }
  }, []);

  // ─── syncLoginEmail: se llama al hacer login/register ────────────────────
  // Sincroniza el email del login con el perfil. Si ya hay un perfil guardado
  // para este email, lo carga. Si no, crea uno nuevo con el nombre y email.
  const syncLoginEmail = useCallback(async (name, email) => {
    const current = profileRef.current;

    // Si el perfil ya tiene este email (volvió a entrar), no hacer nada
    if (current.email === email && current.fullName) {
      return;
    }

    // Si el perfil no tiene email o es diferente, actualizar
    const updated = {
      ...current,
      email: email,
      fullName: current.fullName || name || email.split('@')[0],
    };
    setProfile(updated);
    profileRef.current = updated;
    await persistProfile(updated);
  }, [persistProfile]);

  // ─── updatePersonal ──────────────────────────────────────────────────────
  const updatePersonal = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setProfile((prev) => {
        const updated = { ...prev, fullName: data.fullName, phone: data.phone };
        persistProfile(updated);
        profileRef.current = updated;
        return updated;
      });
    } catch (e) {
      setError('No se pudo actualizar los datos personales.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  // ─── updateAddress ───────────────────────────────────────────────────────
  const updateAddress = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setProfile((prev) => {
        const updated = {
          ...prev,
          address: {
            street: data.street,
            number: data.number,
            zipCode: data.zipCode,
            city: data.city,
            state: data.state,
          },
        };
        persistProfile(updated);
        profileRef.current = updated;
        return updated;
      });
    } catch (e) {
      setError('No se pudo actualizar el domicilio.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  // ─── updateCard ──────────────────────────────────────────────────────────
  const updateCard = useCallback(async (updatedCard) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setProfile((prev) => {
        const updated = {
          ...prev,
          paymentMethods: prev.paymentMethods.map((c) =>
            c.id === updatedCard.id ? { ...c, ...updatedCard } : c
          ),
        };
        persistProfile(updated);
        profileRef.current = updated;
        return updated;
      });
    } catch (e) {
      setError('No se pudo actualizar la tarjeta.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  // ─── addCard ─────────────────────────────────────────────────────────────
  const addCard = useCallback(async (newCard) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const id = String(Date.now());
      setProfile((prev) => {
        const updated = {
          ...prev,
          paymentMethods: [...prev.paymentMethods, { ...newCard, id }],
        };
        persistProfile(updated);
        profileRef.current = updated;
        return updated;
      });
    } catch (e) {
      setError('No se pudo agregar la tarjeta.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  // ─── deleteCard ──────────────────────────────────────────────────────────
  const deleteCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setProfile((prev) => {
        const updated = {
          ...prev,
          paymentMethods: prev.paymentMethods.filter((c) => c.id !== cardId),
        };
        persistProfile(updated);
        profileRef.current = updated;
        return updated;
      });
    } catch (e) {
      setError('No se pudo eliminar la tarjeta.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  // ─── saveFromCheckout ────────────────────────────────────────────────────
  const saveFromCheckout = useCallback(async ({ address, cardName }) => {
    try {
      const current = profileRef.current;
      let updated = { ...current };

      if (address) {
        updated.address = {
          street:  address.calle,
          number:  address.numero,
          zipCode: address.codigoPostal,
          city:    address.ciudad,
          state:   address.ciudad,
        };
      }

      if (cardName && cardName.trim() && !current.fullName) {
        updated.fullName = cardName.trim();
      }



      setProfile(updated);
      profileRef.current = updated;

      const ops = [
        [KEYS.FULL_PROFILE, JSON.stringify(updated)],
        [KEYS.HAS_PURCHASED, 'true'],
      ];
      if (address) {
        ops.push([KEYS.SHIPPING_ADDRESS, JSON.stringify(address)]);
        setSavedShippingAddress(address);
      }
      await AsyncStorage.multiSet(ops);
      setHasPurchased(true);
    } catch (e) {
      console.warn('[ProfileContext] saveFromCheckout error:', e);
    }
  }, []);

  // ─── handleLogout: limpia datos sensibles del perfil ─────────────────────
  // Borra tarjetas y dirección del AsyncStorage pero mantiene preferencias
  const handleLogout = useCallback(async () => {
    setLoading(false); // Resetear por si quedó loading de una op anterior
    setError(null);
    try {
      await AsyncStorage.multiRemove([
        KEYS.FULL_PROFILE,
        KEYS.SHIPPING_ADDRESS,
        KEYS.HAS_PURCHASED,
      ]);
      setProfile(initialUserData);
      profileRef.current = initialUserData;
      setSavedShippingAddress(null);
      setHasPurchased(false);
    } catch (e) {
      console.warn('[ProfileContext] logout error:', e);
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        isHydrated,
        hasPurchased,
        savedShippingAddress,
        // CRUD
        updatePersonal,
        updateAddress,
        updateCard,
        addCard,
        deleteCard,
        // Auth sync
        syncLoginEmail,
        handleLogout,
        // Checkout
        saveFromCheckout,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile debe usarse dentro de <ProfileProvider>');
  }
  return ctx;
}
