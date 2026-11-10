import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { createCustomRide } from '@/lib/transport-store';
import type { TransportRide, VehicleType, UnitType } from '@/types/transport';

type PostRideModalProps = {
  visible: boolean;
  onClose: () => void;
  onRideCreated: (ride: TransportRide) => void;
};

const VEHICLES: { type: VehicleType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'tata_ace', labelKey: 'postRide.vehicleTataAce', icon: '🚚' },
  { type: 'bolero_pickup', labelKey: 'postRide.vehicleBolero', icon: '🛻' },
  { type: 'tractor', labelKey: 'postRide.vehicleTractor', icon: '🚜' },
  { type: 'three_wheeler', labelKey: 'postRide.vehicleThreeWheeler', icon: '🛺' },
];

export function PostRideModal({ visible, onClose, onRideCreated }: PostRideModalProps) {
  const { t } = useI18n();
  const { profile } = useAppData();

  const [fromVillage, setFromVillage] = useState(profile?.location?.label ?? '');
  const [toMarket, setToMarket] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('tata_ace');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [capacityPercent, setCapacityPercent] = useState(50);
  const [farePerUnit, setFarePerUnit] = useState('120');
  const [unitType, setUnitType] = useState<UnitType>('sack');
  const [pickupHub, setPickupHub] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const from = fromVillage.trim();
    const to = toMarket.trim();
    const vehicleNo = vehicleNumber.trim();

    if (!from || !to || !vehicleNo) {
      setError(t('postRide.errorMissingFields'));
      return;
    }

    setError(null);

    try {
      setLoading(true);
      const newRide: TransportRide = {
        id: `ride-${Date.now()}`,
        driverName: profile?.name || 'Vehicle Owner',
        driverPhone: profile?.phone || '+91 98000 00000',
        vehicleType,
        vehicleNumber: vehicleNo,
        fromVillage: from,
        toMarket: to,
        district: 'Maharashtra',
        departureDate: 'Tomorrow',
        departureTime: '06:00 AM',
        availableCapacityPercent: capacityPercent,
        availableWeightKg: Math.round(capacityPercent * 8),
        farePerUnit: Number(farePerUnit) || 100,
        unitType,
        estimatedMarketDistanceKm: 55,
        pickupHub: pickupHub.trim() || from,
        isVerified: false,
        voiceSummary: {
          mr: `${from} ते ${to} साठी गाडी उपलब्ध आहे. भाडे ${farePerUnit} रुपये प्रति ${unitType}.`,
          hi: `${from} से ${to} के लिए गाड़ी उपलब्ध है। किराया ${farePerUnit} रुपये प्रति ${unitType}।`,
          en: `Vehicle leaving ${from} for ${to}. Fare ${farePerUnit} per ${unitType}.`,
        },
      };

      await createCustomRide(newRide);
      onRideCreated(newRide);
      onClose();
    } catch (err) {
      console.warn('Failed to post ride:', err);
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
              <Text style={styles.eyebrow}>{t('postRide.eyebrow')}</Text>
              <Text style={styles.title}>{t('postRide.title')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <AppIcon name={Icons.close} size={18} color={Brand.inkMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Vehicle Type Selector */}
            <Text style={styles.label}>{t('postRide.vehicleTypeLabel')}</Text>
            <View style={styles.vehicleRow}>
              {VEHICLES.map((v) => {
                const active = vehicleType === v.type;
                return (
                  <Pressable
                    key={v.type}
                    style={[styles.vehicleBtn, active && styles.vehicleBtnActive]}
                    onPress={() => setVehicleType(v.type)}>
                    <Text style={styles.vehicleIcon}>{v.icon}</Text>
                    <Text style={[styles.vehicleText, active && styles.vehicleTextActive]}>
                      {t(v.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Route Inputs */}
            <Text style={styles.label}>{t('postRide.fromLabel')}</Text>
            <TextInput
              style={styles.input}
              value={fromVillage}
              onChangeText={(value) => {
                setFromVillage(value);
                setError(null);
              }}
              placeholder={t('postRide.fromPlaceholder')}
              placeholderTextColor={Brand.inkFaint}
            />

            <Text style={styles.label}>{t('postRide.toLabel')}</Text>
            <TextInput
              style={styles.input}
              value={toMarket}
              onChangeText={(value) => {
                setToMarket(value);
                setError(null);
              }}
              placeholder={t('postRide.toPlaceholder')}
              placeholderTextColor={Brand.inkFaint}
            />

            <Text style={styles.label}>{t('postRide.vehicleNumberLabel')}</Text>
            <TextInput
              style={styles.input}
              value={vehicleNumber}
              onChangeText={(value) => {
                setVehicleNumber(value);
                setError(null);
              }}
              placeholder="MH 12 AB 1234"
              placeholderTextColor={Brand.inkFaint}
              autoCapitalize="characters"
            />

            {/* Unit Type Selection */}
            <Text style={styles.label}>{t('postRide.unitLabel')}</Text>
            <View style={styles.vehicleRow}>
              {(['sack', 'crate', 'quintal'] as UnitType[]).map((u) => {
                const active = unitType === u;
                const unitKey =
                  u === 'sack'
                    ? 'postRide.unitSack'
                    : u === 'crate'
                      ? 'postRide.unitCrate'
                      : 'postRide.unitQuintal';
                return (
                  <Pressable
                    key={u}
                    style={[styles.vehicleBtn, active && styles.vehicleBtnActive]}
                    onPress={() => setUnitType(u)}>
                    <Text style={[styles.vehicleText, active && styles.vehicleTextActive]}>
                      {t(unitKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Fare and Capacity */}
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text style={styles.label}>{t('postRide.fareLabel')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={farePerUnit}
                  onChangeText={setFarePerUnit}
                  placeholder="120"
                  placeholderTextColor={Brand.inkFaint}
                />
              </View>

              <View style={styles.splitCol}>
                <Text style={styles.label}>{t('postRide.capacityLabel')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(capacityPercent)}
                  onChangeText={(val) =>
                    setCapacityPercent(Math.min(100, Math.max(0, Number(val) || 0)))
                  }
                  placeholder="50"
                  placeholderTextColor={Brand.inkFaint}
                />
              </View>
            </View>

            {/* Pickup Hub Point */}
            <Text style={styles.label}>{t('postRide.pickupLabel')}</Text>
            <TextInput
              style={styles.input}
              value={pickupHub}
              onChangeText={setPickupHub}
              placeholder={t('postRide.pickupPlaceholder')}
              placeholderTextColor={Brand.inkFaint}
            />

            {error ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Pressable
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.submitBtnText}>
                {loading ? t('postRide.postingButton') : t('postRide.publishButton')}
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
    marginBottom: 6,
    marginTop: 8,
  },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  vehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  vehicleBtnActive: {
    backgroundColor: Brand.surfaceTint,
    borderColor: Brand.ink,
  },
  vehicleIcon: {
    fontSize: 14,
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.inkMuted,
  },
  vehicleTextActive: {
    color: Brand.ink,
  },
  input: {
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Brand.ink,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
    marginBottom: 10,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitCol: {
    flex: 1,
  },
  errorText: {
    color: Brand.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
    marginLeft: 2,
  },
  submitBtn: {
    backgroundColor: Brand.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.surface,
  },
});
