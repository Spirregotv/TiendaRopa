// ─────────────────────────────────────────────────────────────────────────────
// Tema global del Admin Dashboard — FashionFlow
// ─────────────────────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  accent: '#EC4899',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
};

export const STATUS_CONFIG = {
  Pendiente: {
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
    icon: 'clock-outline',
  },
  'Pago Recibido': {
    bg: '#DBEAFE',
    text: '#1E40AF',
    dot: '#3B82F6',
    icon: 'check-circle-outline',
  },
  Preparando: {
    bg: '#EDE9FE',
    text: '#5B21B6',
    dot: '#8B5CF6',
    icon: 'package-variant',
  },
  Enviado: {
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
    icon: 'truck-delivery-outline',
  },
};

export const ORDER_STATUSES = ['Pendiente', 'Pago Recibido', 'Preparando', 'Enviado'];

export const CATEGORIES = [
  'Blusas',
  'Pantalones',
  'Vestidos',
  'Faldas',
  'Chaquetas',
  'Abrigos',
  'Ropa Interior',
  'Accesorios',
  'Calzado',
  'Deportivo',
  'Otros',
];

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
