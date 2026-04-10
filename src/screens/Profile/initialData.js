// Valores por defecto para un usuario NUEVO (sin datos guardados).
// El email se sobreescribe con el email real de login.
export const initialUserData = {
  fullName: '',
  email: '',
  phone: '',
  address: {
    street: '',
    number: '',
    zipCode: '',
    city: '',
    state: '',
  },
  paymentMethods: [],
};
