import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { bookTransportSpace } from '@/lib/transport-store';
import type { TransportRide, CargoCategory, TransportBooking } from '@/types/transport';

type BookRideModalProps = {
  ride: TransportRide | null;
  visible: boolean;
  onClose: () => void;
  onBookingSuccess: (booking: TransportBooking) => void;
};

const CARGO_OPTIONS: { key: CargoCategory; labelKey: TranslationKey; icon: string }[] = [
  { key: 'vegetables', labelKey: 'category.vegetables', icon: '🥬' },
  { key: 'fruits', labelKey: 'category.fruits', icon: '🥭' },
  { key: 'grains', labelKey: 'category.grains', icon: '🌾' },
  { key: 'kirana', labelKey: 'category.kirana', icon: '📦' },
  { key: 'handcrafts', labelKey: 'category.handcrafts', icon: '🧵' },
];

export function BookRideModal({ ride, visible, onClose, onBookingSuccess }: BookRideModalProps) {
  const { t } = useI18n();
  const { profile } = useAppData();
  const [selectedCategory, setSelectedCategory] = useState<CargoCategory>('vegetables');
  const [quantity, setQuantity] = useState(4);
  const [loading, setLoading] = useState(false);

  if (!ride) return null;

  const totalFare = ride.farePerUnit * quantity;
  const privateCharterCost = 1800;
  const savings = Math.max(0, privateCharterCost - totalFare);
  const unitLabelKey =
    ride.unitType === 'sack'
      ? 'bookRide.unitSacks'
      : ride.unitType === 'crate'
        ? 'bookRide.unitCrates'
        : 'bookRide.unitQuintals';

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const booking = await bookTransportSpace({
        ride,
        userName: profile?.name || 'Village Member',
        userPhone: profile?.phone || '+91 98000 00000',
        cargoCategory: selectedCategory,
        quantity,
      });
      onBookingSuccess(booking);
      onClose();
    } catch (err) {
      console.warn('Booking failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{t('bookRide.eyebrow')}</Text>
              <Text style={styles.title}>{ride.toMarket}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <AppIcon name={Icons.close} size={18} color={Brand.inkMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Cargo Category Selector */}
            <Text style={styles.sectionTitle}>{t('bookRide.selectCargoType')}</Text>
            <View style={styles.categoryWrap}>
              {CARGO_OPTIONS.map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat.key)}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {t(cat.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quantity Stepper */}
            <Text style={styles.sectionTitle}>
              {t('bookRide.selectQuantity', { unit: ride.unitType })}
            </Text>

            <View style={styles.quantityCard}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>

              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyNumber}>{quantity}</Text>
                <Text style={styles.qtyUnit}>{t(unitLabelKey)}</Text>
              </View>

              <Pressable
                style={styles.stepBtn}
                onPress={() => setQuantity((q) => Math.min(50, q + 1))}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>

            {/* Price & Savings Comparison Box */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('bookRide.pooledRate')}</Text>
                <Text style={styles.summaryValue}>₹{ride.farePerUnit} × {quantity}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>{t('bookRide.totalPayable')}</Text>
                <Text style={styles.summaryTotalValue}>₹{totalFare}</Text>
              </View>

              <View style={styles.savingsBanner}>
                <Text style={styles.savingsIcon}>🎉</Text>
                <Text style={styles.savingsText}>
                  {t('bookRide.savingsBanner', { savings })}
                </Text>
              </View>
            </View>

            {/* Pickup Location Info */}
            <View style={styles.pickupCard}>
              <AppIcon name={Icons.location} size={16} color={Brand.ink} />
              <View style={styles.pickupWrap}>
                <Text style={styles.pickupLabel}>{t('bookRide.pickupLabel')}</Text>
                <Text style={styles.pickupValue}>{ride.pickupHub}</Text>
              </View>
            </View>

            {/* Confirmation CTA */}
            <Pressable
              style={[styles.confirmBtn, loading && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={loading}>
              <Text style={styles.confirmBtnText}>
                {loading
                  ? t('bookRide.booking')
                  : t('bookRide.confirmBooking', { fare: totalFare })}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 19, 31, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(22, 19, 31, 0.15)',
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.accentInk,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.ink,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Brand.surfaceMuted,
  },
  scroll: {
    maxHeight: 520,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
    marginBottom: 10,
    marginTop: 6,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Brand.surfaceTint,
    borderColor: Brand.ink,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.inkMuted,
  },
  categoryTextActive: {
    color: Brand.ink,
    fontWeight: '800',
  },
  quantityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.1)',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.ink,
    lineHeight: 24,
  },
  qtyDisplay: {
    alignItems: 'center',
  },
  qtyNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Brand.ink,
  },
  qtyUnit: {
    fontSize: 12,
    color: Brand.inkMuted,
    fontWeight: '600',
  },
  summaryBox: {
    backgroundColor: Brand.surfaceTint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Brand.inkMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.ink,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F9D58',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  savingsIcon: {
    fontSize: 16,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F9D58',
    flex: 1,
  },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    gap: 10,
  },
  pickupWrap: {
    flex: 1,
  },
  pickupLabel: {
    fontSize: 10,
    color: Brand.inkMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pickupValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: Brand.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.surface,
  },
});
