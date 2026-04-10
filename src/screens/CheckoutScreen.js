import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { APP_CONFIG } from '../constants/Config';
import { useInventory } from '../context/InventoryContext';
import { useOrders, OXXO_ACCOUNT } from '../context/OrdersContext';
import { useProfile } from '../context/ProfileContext';

const AZ = {
  orange: '#FF9900',
  yellow: '#FFD814',
  yellowBorder: '#C89411',
  teal: '#007185',
  greenDeal: '#067D62',
};

const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta de Crédito/Débito', icon: 'card-outline' },
  { id: 'cash', label: 'Pago en Efectivo (Oxxo)', icon: 'cash-outline' },
];

export default function CheckoutScreen({ navigation }) {
  const { cartDetails, clearCart, userEmail, validateStock, deductStock } = useInventory();
  const { placeOrder } = useOrders();
  // ✅ useProfile → datos guardados del perfil + AsyncStorage
  const {
    profile,
    hasPurchased,
    savedShippingAddress,
    isHydrated,
    saveFromCheckout,
  } = useProfile();

  const [step, setStep] = useState(1);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // ─── Address state ──────────────────────────────────────────────────────────
  const [address, setAddress] = useState({
    calle: '',
    numero: '',
    codigoPostal: '',
    ciudad: '',
    referencias: '',
  });
  const [savedAddress, setSavedAddress] = useState(true); // default ON para primera compra

  // ─── Payment state ──────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // ─── AutoComplete: precarga datos cuando AsyncStorage esté listo ──────────
  useEffect(() => {
    if (!isHydrated) return;

    // 1) Intentar precargar dirección guardada del checkout anterior
    if (savedShippingAddress) {
      setAddress((prev) => ({
        calle:         savedShippingAddress.calle         || prev.calle,
        numero:        savedShippingAddress.numero        || prev.numero,
        codigoPostal:  savedShippingAddress.codigoPostal  || prev.codigoPostal,
        ciudad:        savedShippingAddress.ciudad        || prev.ciudad,
        referencias:   savedShippingAddress.referencias   || prev.referencias,
      }));
    }
    // 2) Fallback: precargar del perfil si no hay dirección de checkout
    else if (profile?.address) {
      const a = profile.address;
      setAddress((prev) => ({
        calle:        a.street   || prev.calle,
        numero:       a.number   || prev.numero,
        codigoPostal: a.zipCode  || prev.codigoPostal,
        ciudad:       a.city     || prev.ciudad,
        referencias:  prev.referencias,
      }));
    }

    // 3) Precargar datos de la tarjeta guardada (primera tarjeta del perfil)
    if (profile?.paymentMethods?.length > 0) {
      const saved = profile.paymentMethods[0];
      if (saved.cardNumber) {
        // Formatear número completo con espacios cada 4 dígitos
        const formatted = saved.cardNumber.replace(/(.{4})/g, '$1 ').trim();
        setCardNumber(formatted);
      }
      if (saved.holder) setCardName(saved.holder);
      if (saved.exp)    setCardExpiry(saved.exp);
    } else if (profile?.fullName) {
      setCardName(profile.fullName);
    }

  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cart calculations ──────────────────────────────────────────────────────
  const cartItems = cartDetails.cartItems;
  const subtotal = cartDetails.cartTotal;
  const freeShipping = subtotal >= APP_CONFIG.freeShippingMin;
  const shippingCost = freeShipping ? 0 : 99;
  const total = subtotal + shippingCost;

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').substring(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardNumberChange = (text) => {
    setCardNumber(formatCardNumber(text));
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length > 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    return cleaned;
  };

  // ─── Validators ─────────────────────────────────────────────────────────────
  const validateAddress = () => {
    const { calle, numero, codigoPostal, ciudad } = address;
    if (!calle.trim() || !numero.trim() || !codigoPostal.trim() || !ciudad.trim()) {
      Alert.alert('Error', 'Completa todos los campos de dirección obligatorios.');
      return false;
    }
    if (!/^[0-9]{5}$/.test(codigoPostal.trim())) {
      Alert.alert('Error', 'El código postal debe tener 5 dígitos.');
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Selecciona un método de pago.');
      return false;
    }
    if (paymentMethod === 'card') {
      // Limpiar asteriscos para validar dígitos reales
      const cleanNumber = cardNumber.replace(/[^0-9]/g, '');
      if (cleanNumber.length < 16) {
        Alert.alert('Error', 'Número de tarjeta debe tener 16 dígitos. Ingresa los 16 dígitos completos.');
        return false;
      }
      if (!cardName.trim()) {
        Alert.alert('Error', 'Ingresa el nombre del titular.');
        return false;
      }
      if (cardExpiry.length < 5) {
        Alert.alert('Error', 'Ingresa la fecha de vencimiento (MM/AA).');
        return false;
      }
      // Validar expiración no vencida
      const [mm, yy] = cardExpiry.split('/');
      if (mm && yy) {
        const expDate = new Date(2000 + parseInt(yy, 10), parseInt(mm, 10) - 1, 1);
        if (expDate < new Date()) {
          Alert.alert('Error', 'La tarjeta ha expirado.');
          return false;
        }
      }
      // ✅ CVV: exactamente 3 dígitos numéricos
      const cleanCvv = cardCvv.replace(/[^0-9]/g, '');
      if (cleanCvv.length !== 3) {
        Alert.alert('Error', 'El CVV debe tener exactamente 3 dígitos numéricos.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateAddress()) setStep(2);
    else if (step === 2 && validatePayment()) setStep(3);
  };

  // ─── handleConfirmOrder + handleSaveData ──────────────────────────────────
  const handleConfirmOrder = async () => {
    // ── Validación de stock antes de cualquier mutación ──────────────────
    const stockCheck = validateStock(cartItems);
    if (!stockCheck.valid) {
      Alert.alert(
        'Stock insuficiente',
        stockCheck.problems.join('\n\n') +
          '\n\nAlgunos productos se agotaron mientras comprabas.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // ── Si paga con tarjeta → descontar stock inmediatamente ────────────
    if (paymentMethod === 'card') {
      deductStock(cartItems);
    }

    const order = placeOrder({
      items: cartItems,
      total,
      subtotal,
      shippingCost,
      paymentMethod,
      address,
      userId: userEmail,
    });

    // ✅ handleSaveData: al confirmar compra, guardar datos en el perfil + AsyncStorage
    if (savedAddress) {
      try {
        await saveFromCheckout({
          address: address,
          cardName: cardName,
        });
      } catch (e) {
        // No bloquear la compra por error de persistencia
        console.warn('[Checkout] Error saving data:', e);
      }
    }

    clearCart();
    setConfirmedOrder(order);
    setStep(4);
  };

  const handleGoHome = () => {
    navigation.navigate('ClientTabs', { screen: 'Tienda' });
  };

  // ─── Barcode renderer ────────────────────────────────────────────────────
  const renderBarcode = (ref) => {
    const bars = [];
    for (let i = 0; i < ref.length; i++) {
      const digit = parseInt(ref[i], 10);
      bars.push(
        <View
          key={`b${i}`}
          style={{
            width: digit % 3 === 0 ? 3 : digit % 2 === 0 ? 2 : 1,
            height: 50,
            backgroundColor: '#000',
            marginRight: 1,
          }}
        />
      );
      bars.push(
        <View
          key={`s${i}`}
          style={{
            width: digit % 2 === 0 ? 2 : 1,
            height: 50,
            backgroundColor: '#FFF',
            marginRight: 1,
          }}
        />
      );
    }
    return bars;
  };

  // ─── Loading spinner while hydrating ──────────────────────────────────────
  if (!isHydrated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AZ.teal} />
        <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
          Cargando tus datos...
        </Text>
      </View>
    );
  }

  // ─── Step 4: Confirmation / Oxxo Ticket ──────────────────────────────────
  if (step === 4 && confirmedOrder) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <ScrollView contentContainerStyle={styles.confirmationScroll}>
          {confirmedOrder.paymentMethod === 'Efectivo - Oxxo' ? (
            <View style={styles.ticketContainer}>
              <View style={styles.ticketHeader}>
                <View style={styles.oxxoLogo}>
                  <Text style={styles.oxxoLogoText}>OXXO</Text>
                </View>
                <Text style={styles.ticketTitle}>Ficha de Depósito</Text>
                <Text style={styles.ticketSubtitle}>
                  {APP_CONFIG.storeName} · Pedido #{confirmedOrder.orderId}
                </Text>
              </View>
              <View style={styles.ticketAmountBox}>
                <Text style={styles.ticketAmountLabel}>Monto a pagar</Text>
                <Text style={styles.ticketAmount}>
                  {APP_CONFIG.currency}
                  {confirmedOrder.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.ticketInfoRow}>
                <Text style={styles.ticketInfoLabel}>Cuenta destino</Text>
                <Text style={styles.ticketInfoValue}>{OXXO_ACCOUNT}</Text>
              </View>
              <View style={styles.ticketInfoRow}>
                <Text style={styles.ticketInfoLabel}>Referencia</Text>
                <Text style={styles.ticketReference}>{confirmedOrder.paymentRef}</Text>
              </View>
              <View style={styles.barcodeContainer}>
                <View style={styles.barcodeStripes}>
                  {renderBarcode(confirmedOrder.paymentRef)}
                </View>
                <Text style={styles.barcodeText}>{confirmedOrder.paymentRef}</Text>
              </View>
              <View style={styles.ticketInstructions}>
                <Text style={styles.instructionsTitle}>
                  <Ionicons name="information-circle" size={16} color={AZ.teal} />{' '}
                  Instrucciones
                </Text>
                <Text style={styles.instructionsText}>
                  1. Acude a cualquier <Text style={{ fontWeight: '700' }}>Oxxo</Text>.
                </Text>
                <Text style={styles.instructionsText}>
                  2. Indica que realizarás un depósito a la cuenta:{'\n'}
                  <Text style={{ fontWeight: '700' }}>{OXXO_ACCOUNT}</Text>
                </Text>
                <Text style={styles.instructionsText}>
                  3. Proporciona tu número de referencia:{'\n'}
                  <Text style={{ fontWeight: '700' }}>{confirmedOrder.paymentRef}</Text>
                </Text>
                <Text style={styles.instructionsText}>
                  4. Tienes <Text style={{ fontWeight: '700', color: Colors.danger }}>48 horas</Text> para realizar el pago.
                </Text>
              </View>
              <View style={styles.expiryBanner}>
                <Ionicons name="time-outline" size={16} color={AZ.orange} />
                <Text style={styles.expiryText}>
                  Este ticket vence el{' '}
                  {new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardConfirmation}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={40} color="#FFF" />
              </View>
              <Text style={styles.successTitle}>¡Pedido Confirmado!</Text>
              <Text style={styles.successOrderId}>
                Pedido #{confirmedOrder.orderId}
              </Text>
              <Text style={styles.successMsg}>
                Tu pago con tarjeta fue procesado exitosamente.
                {'\n'}Recibirás una confirmación por correo electrónico.
              </Text>
              <View style={styles.successTotal}>
                <Text style={styles.successTotalLabel}>Total pagado</Text>
                <Text style={styles.successTotalAmount}>
                  {APP_CONFIG.currency}
                  {confirmedOrder.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}

          {/* ✅ Banner: datos guardados para la próxima vez */}
          <View style={styles.savedDataBanner}>
            <Ionicons name="shield-checkmark" size={18} color={AZ.greenDeal} />
            <Text style={styles.savedDataText}>
              Tus datos fueron guardados para futuras compras
            </Text>
          </View>

          <TouchableOpacity style={styles.goHomeBtn} onPress={handleGoHome}>
            <Ionicons name="storefront-outline" size={18} color="#111" />
            <Text style={styles.goHomeBtnText}>Volver a la tienda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewOrdersBtn}
            onPress={() => navigation.navigate('ClientTabs', { screen: 'Perfil' })}
          >
            <Text style={styles.viewOrdersBtnText}>Ver mis pedidos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Main Checkout ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, s <= step && styles.stepCircleActive]}>
              {s < step ? (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              ) : (
                <Text style={[styles.stepNum, s <= step && styles.stepNumActive]}>{s}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, s <= step && styles.stepLabelActive]}>
              {s === 1 ? 'Dirección' : s === 2 ? 'Pago' : 'Resumen'}
            </Text>
          </View>
        ))}
        <View style={styles.stepLine}>
          <View style={[styles.stepLineProgress, { width: `${((step - 1) / 2) * 100}%` }]} />
        </View>
      </View>

      {/* ✅ Banner de datos precargados */}
      {hasPurchased && step === 1 && (
        <View style={styles.precargaBanner}>
          <Ionicons name="flash" size={16} color={AZ.teal} />
          <Text style={styles.precargaText}>
            Datos precargados de tu última compra. Puedes editarlos si es necesario.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Address */}
          {step === 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={20} color={AZ.teal} />
                <Text style={styles.sectionTitle}>Dirección de envío</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Calle *</Text>
                <TextInput
                  style={[styles.input, address.calle ? styles.inputFilled : null]}
                  placeholder="Av. Reforma"
                  placeholderTextColor={Colors.textLight}
                  value={address.calle}
                  onChangeText={(t) => setAddress({ ...address, calle: t })}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Número *</Text>
                  <TextInput
                    style={[styles.input, address.numero ? styles.inputFilled : null]}
                    placeholder="123"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                    value={address.numero}
                    onChangeText={(t) => setAddress({ ...address, numero: t })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Código Postal *</Text>
                  <TextInput
                    style={[styles.input, address.codigoPostal ? styles.inputFilled : null]}
                    placeholder="06600"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                    maxLength={5}
                    value={address.codigoPostal}
                    onChangeText={(t) => setAddress({ ...address, codigoPostal: t })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ciudad *</Text>
                <TextInput
                  style={[styles.input, address.ciudad ? styles.inputFilled : null]}
                  placeholder="Ciudad de México"
                  placeholderTextColor={Colors.textLight}
                  value={address.ciudad}
                  onChangeText={(t) => setAddress({ ...address, ciudad: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Referencias</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Entre calle X y calle Y..."
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                  value={address.referencias}
                  onChangeText={(t) => setAddress({ ...address, referencias: t })}
                />
              </View>

              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={() => setSavedAddress(!savedAddress)}
              >
                <Ionicons
                  name={savedAddress ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={savedAddress ? AZ.teal : Colors.textLight}
                />
                <Text style={styles.saveAddressText}>
                  Guardar como dirección predeterminada
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card-outline" size={20} color={AZ.teal} />
                <Text style={styles.sectionTitle}>Método de pago</Text>
              </View>

              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.id}
                  style={[
                    styles.paymentOption,
                    paymentMethod === pm.id && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod(pm.id)}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      paymentMethod === pm.id && styles.radioOuterActive,
                    ]}
                  >
                    {paymentMethod === pm.id && <View style={styles.radioInner} />}
                  </View>
                  <Ionicons
                    name={pm.icon}
                    size={20}
                    color={paymentMethod === pm.id ? AZ.teal : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paymentLabel,
                      paymentMethod === pm.id && styles.paymentLabelActive,
                    ]}
                  >
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {paymentMethod === 'card' && (
                <View style={styles.cardForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Número de tarjeta</Text>
                    <View style={styles.cardInputRow}>
                      <Ionicons name="card" size={18} color={Colors.textLight} />
                      <TextInput
                        style={styles.cardInput}
                        placeholder="1234 5678 9012 3456"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="number-pad"
                        maxLength={19}
                        value={cardNumber}
                        onChangeText={handleCardNumberChange}
                      />
                    </View>
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre del titular</Text>
                    <TextInput
                      style={[styles.input, cardName ? styles.inputFilled : null]}
                      placeholder="Juan Pérez"
                      placeholderTextColor={Colors.textLight}
                      value={cardName}
                      onChangeText={setCardName}
                    />
                    {/* ✅ Indicador de precarga */}
                    {hasPurchased && cardName && (
                      <Text style={styles.precargaHint}>
                        <Ionicons name="flash-outline" size={11} color={AZ.teal} /> Precargado
                      </Text>
                    )}
                  </View>
                  <View style={styles.rowFields}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Vencimiento</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="number-pad"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>CVV</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="number-pad"
                        maxLength={3}
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={(t) => setCardCvv(t.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  </View>
                </View>
              )}

              {paymentMethod === 'cash' && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={18} color={AZ.teal} />
                  <Text style={styles.infoBoxText}>
                    Se generará una ficha de depósito con referencia única para pagar en cualquier Oxxo. Tienes 48 horas para realizar el pago.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt-outline" size={20} color={AZ.teal} />
                <Text style={styles.sectionTitle}>Resumen del pedido</Text>
              </View>

              {cartItems.map((ci) => (
                <View key={ci.id} style={styles.summaryItem}>
                  <View style={styles.summaryItemInfo}>
                    <Text style={styles.summaryItemName} numberOfLines={1}>
                      {ci.nombre}
                    </Text>
                    <Text style={styles.summaryItemQty}>× {ci.quantity}</Text>
                  </View>
                  <Text style={styles.summaryItemPrice}>
                    {APP_CONFIG.currency}{(ci.precioVenta * ci.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryBlock}>
                <Text style={styles.summaryBlockLabel}>Enviar a:</Text>
                <Text style={styles.summaryBlockValue}>
                  {address.calle} #{address.numero}, CP {address.codigoPostal}, {address.ciudad}
                </Text>
              </View>

              <View style={styles.summaryBlock}>
                <Text style={styles.summaryBlockLabel}>Pago:</Text>
                <Text style={styles.summaryBlockValue}>
                  {PAYMENT_METHODS.find((pm) => pm.id === paymentMethod)?.label}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>
                  {APP_CONFIG.currency}{subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Envío</Text>
                <Text style={[styles.totalValue, freeShipping && { color: AZ.greenDeal }]}>
                  {freeShipping ? 'GRATIS' : `${APP_CONFIG.currency}${shippingCost.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>
                  {APP_CONFIG.currency}{total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          {step < 3 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {step === 1 ? 'Continuar al pago' : 'Revisar pedido'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#111" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmOrder}>
              <Ionicons name="lock-closed" size={16} color="#FFF" />
              <Text style={styles.confirmBtnText}>Confirmar pedido</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },

  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  stepItem: { alignItems: 'center', gap: 4, zIndex: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  stepCircleActive: { backgroundColor: AZ.teal, borderColor: AZ.teal },
  stepNum: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  stepNumActive: { color: '#FFF' },
  stepLabel: { fontSize: 11, color: Colors.textLight },
  stepLabelActive: { color: AZ.teal, fontWeight: '600' },
  stepLine: {
    position: 'absolute', top: 30, left: '20%', right: '20%',
    height: 2, backgroundColor: Colors.border,
  },
  stepLineProgress: { height: '100%', backgroundColor: AZ.teal },

  // ✅ Banner de datos precargados
  precargaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 8, padding: 10,
    backgroundColor: '#E8F8F8', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: AZ.teal,
  },
  precargaText: { flex: 1, fontSize: 12, color: AZ.teal, fontWeight: '500' },
  precargaHint: { fontSize: 11, color: AZ.teal, marginTop: 2, marginLeft: 2 },

  scrollContent: { paddingBottom: 100 },
  section: { margin: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },

  formGroup: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary,
  },
  // ✅ Estilo visual para campos que están pre-rellenados
  inputFilled: {
    borderColor: AZ.teal + '40',
    backgroundColor: '#FAFFFE',
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: 12 },

  saveAddressBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  saveAddressText: { fontSize: 14, color: Colors.textPrimary },

  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  paymentOptionActive: { borderColor: AZ.teal, backgroundColor: '#E8F8F8' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: AZ.teal },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: AZ.teal },
  paymentLabel: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  paymentLabelActive: { fontWeight: '600', color: AZ.teal },

  cardForm: { gap: 12, padding: 14, backgroundColor: Colors.surfaceAlt, borderRadius: 12 },
  cardInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14,
  },
  cardInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.textPrimary, letterSpacing: 1 },

  infoBox: {
    flexDirection: 'row', gap: 10, padding: 14, backgroundColor: '#E8F8F8',
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: AZ.teal,
  },
  infoBoxText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  summaryItemInfo: { flex: 1, gap: 2 },
  summaryItemName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  summaryItemQty: { fontSize: 12, color: Colors.textSecondary },
  summaryItemPrice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  summaryBlock: { gap: 2 },
  summaryBlockLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase' },
  summaryBlockValue: { fontSize: 14, color: Colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: Colors.textSecondary },
  totalValue: { fontSize: 14, color: Colors.textPrimary },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  grandTotalLabel: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  grandTotalValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  nextBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: AZ.yellow, borderRadius: 24, paddingVertical: 14, gap: 8,
    borderWidth: 1, borderColor: AZ.yellowBorder,
  },
  nextBtnText: { fontSize: 15, fontWeight: '600', color: '#111' },
  confirmBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: AZ.orange, borderRadius: 24, paddingVertical: 14, gap: 8,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  // Confirmation screen
  confirmationScroll: { padding: 16, paddingBottom: 40 },

  // ✅ Banner de datos guardados en confirmación
  savedDataBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, marginTop: 16, marginBottom: 8,
    backgroundColor: '#E8F8E8', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: AZ.greenDeal,
  },
  savedDataText: { flex: 1, fontSize: 12, color: AZ.greenDeal, fontWeight: '500' },

  // Oxxo ticket
  ticketContainer: {
    backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
  },
  ticketHeader: {
    backgroundColor: '#CC0000', paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 6,
  },
  oxxoLogo: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8,
  },
  oxxoLogoText: { fontSize: 22, fontWeight: '900', color: '#CC0000', letterSpacing: 2 },
  ticketTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginTop: 6 },
  ticketSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  ticketAmountBox: {
    alignItems: 'center', paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  ticketAmountLabel: { fontSize: 13, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  ticketAmount: { fontSize: 36, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },

  ticketInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  ticketInfoLabel: { fontSize: 13, color: Colors.textSecondary },
  ticketInfoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, letterSpacing: 0.5 },
  ticketReference: { fontSize: 18, fontWeight: '700', color: AZ.teal, letterSpacing: 1 },

  barcodeContainer: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  barcodeStripes: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  barcodeText: { fontSize: 12, color: Colors.textSecondary, letterSpacing: 2 },

  ticketInstructions: {
    margin: 16, padding: 14, backgroundColor: '#F0F8FF',
    borderRadius: 10, gap: 8,
  },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  instructionsText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  expiryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, marginTop: 0, padding: 12,
    backgroundColor: '#FFF8E7', borderRadius: 8,
    borderWidth: 1, borderColor: '#FFE0A0',
  },
  expiryText: { flex: 1, fontSize: 12, color: '#8B6914' },

  // Card confirmation
  cardConfirmation: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: AZ.greenDeal, justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  successOrderId: { fontSize: 14, color: Colors.textSecondary },
  successMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 },
  successTotal: { alignItems: 'center', marginTop: 12 },
  successTotalLabel: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase' },
  successTotalAmount: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },

  goHomeBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: AZ.yellow, borderRadius: 24, paddingVertical: 14, gap: 8,
    marginTop: 16, borderWidth: 1, borderColor: AZ.yellowBorder,
  },
  goHomeBtnText: { fontSize: 15, fontWeight: '600', color: '#111' },
  viewOrdersBtn: {
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, marginTop: 8,
  },
  viewOrdersBtnText: { fontSize: 14, fontWeight: '500', color: AZ.teal },
});
