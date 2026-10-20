import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { createCustomRide } from '@/lib/transport-store';
import type { TransportRide, VehicleType, UnitType } from '@/types/transport';

type PostRideModalProps = {
  visible: boolean;
  onClose: () => void;
  onRideCreated: (ride: TransportRide) => void;
};

const VEHICLES: { type: VehicleType; mr: string; hi: string; en: string; icon: string }[] = [
  { type: 'tata_ace', mr: 'छोटा हत्ती', hi: 'छोटा हाथी', en: 'Tata Ace', icon: '🚚' },
  { type: 'bolero_pickup', mr: 'बोलेरो पिकअप', hi: 'बोलेरो पिकअप', en: 'Bolero Pickup', icon: '🛻' },
  { type: 'tractor', mr: 'ट्रॅक्टर', hi: 'ट्रैक्टर', en: 'Tractor', icon: '🚜' },
  { type: 'three_wheeler', mr: 'रिक्षा ऑटो', hi: 'थ्री व्हीलर', en: 'Cargo Auto', icon: '🛺' },
];

export function PostRideModal({ visible, onClose, onRideCreated }: PostRideModalProps) {
  const { language } = useI18n();
  const { profile } = useAppData();

  const [fromVillage, setFromVillage] = useState(profile?.location?.label || 'स्थानिक गाव (Local Village)');
  const [toMarket, setToMarket] = useState('बाजार समिती / APMC Mandi');
  const [vehicleType, setVehicleType] = useState<VehicleType>('tata_ace');
  const [vehicleNumber, setVehicleNumber] = useState('MH 12 AB 1234');
  const [capacityPercent, setCapacityPercent] = useState(50);
  const [farePerUnit, setFarePerUnit] = useState('120');
  const [unitType, setUnitType] = useState<UnitType>('sack');
  const [pickupHub, setPickupHub] = useState('गावातील ग्रामपंचायत चौक');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const newRide: TransportRide = {
        id: `ride-${Date.now()}`,
        driverName: profile?.name || 'गाडी मालक (Vehicle Owner)',
        driverPhone: profile?.phone || '+91 98000 00000',
        vehicleType,
        vehicleNumber,
        fromVillage,
        toMarket,
        district: 'Maharashtra',
        departureDate: 'उद्या (Tomorrow)',
        departureTime: 'सकाळी ०६:०० वा (06:00 AM)',
        availableCapacityPercent: capacityPercent,
        availableWeightKg: Math.round(capacityPercent * 8),
        farePerUnit: Number(farePerUnit) || 100,
        unitType,
        estimatedMarketDistanceKm: 55,
        pickupHub,
        isVerified: true,
        voiceSummary: {
          mr: `${fromVillage} ते ${toMarket} साठी गाडी उपलब्ध आहे. भाडे ${farePerUnit} रुपये प्रति ${unitType}.`,
          hi: `${fromVillage} से ${toMarket} के लिए गाड़ी उपलब्ध है। किराया ${farePerUnit} रुपये प्रति ${unitType}।`,
          en: `Vehicle leaving ${fromVillage} for ${toMarket}. Fare ${farePerUnit} per ${unitType}.`,
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
              <Text style={styles.eyebrow}>
                {language === 'mr' ? 'नवीन गाडी नोंदणी' : language === 'hi' ? 'नई गाड़ी जोड़ें' : 'Share Empty Vehicle Space'}
              </Text>
              <Text style={styles.title}>
                {language === 'mr' ? 'माझी गाडी / फेरी जोडा' : language === 'hi' ? 'अपनी गाड़ी की फेरी जोड़ें' : 'Post Your Trip'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <AppIcon name={Icons.close} size={18} color={Brand.inkMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Vehicle Type Selector */}
            <Text style={styles.label}>
              {language === 'mr' ? 'वाहनाचा प्रकार' : language === 'hi' ? 'वाहन का प्रकार' : 'Vehicle Type'}
            </Text>
            <View style={styles.vehicleRow}>
              {VEHICLES.map((v) => {
                const active = vehicleType === v.type;
                const label = language === 'mr' ? v.mr : language === 'hi' ? v.hi : v.en;
                return (
                  <Pressable
                    key={v.type}
                    style={[styles.vehicleBtn, active && styles.vehicleBtnActive]}
                    onPress={() => setVehicleType(v.type)}>
                    <Text style={styles.vehicleIcon}>{v.icon}</Text>
                    <Text style={[styles.vehicleText, active && styles.vehicleTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Route Inputs */}
            <Text style={styles.label}>
              {language === 'mr' ? 'निघण्याचे ठिकाण (गाव)' : language === 'hi' ? 'रवानगी का स्थान' : 'From (Village)'}
            </Text>
            <TextInput
              style={styles.input}
              value={fromVillage}
              onChangeText={setFromVillage}
              placeholder="उदा. बारामती, जुन्नर"
            />

            <Text style={styles.label}>
              {language === 'mr' ? 'गंतव्य स्थान (मार्केट / APMC)' : language === 'hi' ? 'मंडी / गंतव्य' : 'Destination (Mandi / Market)'}
            </Text>
            <TextInput
              style={styles.input}
              value={toMarket}
              onChangeText={setToMarket}
              placeholder="उदा. पुणे मार्केट यार्ड, वाशी APMC"
            />

            <Text style={styles.label}>
              {language === 'mr' ? 'गाडी क्रमांक (Vehicle Number)' : language === 'hi' ? 'गाड़ी नंबर' : 'Vehicle Number'}
            </Text>
            <TextInput
              style={styles.input}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="MH 12 AB 1234"
              autoCapitalize="characters"
            />

            {/* Unit Type Selection */}
            <Text style={styles.label}>
              {language === 'mr' ? 'भाडे मोजण्याचे एकक (Unit)' : language === 'hi' ? 'किराया इकाई' : 'Fare Unit'}
            </Text>
            <View style={styles.vehicleRow}>
              {(['sack', 'crate', 'quintal'] as UnitType[]).map((u) => {
                const active = unitType === u;
                const label =
                  u === 'sack'
                    ? language === 'mr' ? 'पोते (Sack)' : language === 'hi' ? 'बोरी' : 'Sack'
                    : u === 'crate'
                      ? language === 'mr' ? 'क्रेट (Crate)' : language === 'hi' ? 'क्रेट' : 'Crate'
                      : language === 'mr' ? 'क्विंटल (Quintal)' : language === 'hi' ? 'क्विंटल' : 'Quintal';
                return (
                  <Pressable
                    key={u}
                    style={[styles.vehicleBtn, active && styles.vehicleBtnActive]}
                    onPress={() => setUnitType(u)}>
                    <Text style={[styles.vehicleText, active && styles.vehicleTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Fare and Capacity */}
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text style={styles.label}>
                  {language === 'mr' ? 'प्रति नग भाडे (₹)' : language === 'hi' ? 'किराया (₹)' : 'Fare (₹)'}
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={farePerUnit}
                  onChangeText={setFarePerUnit}
                  placeholder="120"
                />
              </View>

              <View style={styles.splitCol}>
                <Text style={styles.label}>
                  {language === 'mr' ? 'रिकामी जागा (%)' : language === 'hi' ? 'खाली जगह (%)' : 'Free Space (%)'}
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(capacityPercent)}
                  onChangeText={(val) => setCapacityPercent(Number(val) || 0)}
                  placeholder="50"
                />
              </View>
            </View>

            {/* Pickup Hub Point */}
            <Text style={styles.label}>
              {language === 'mr' ? 'गाव संकलन केंद्र (पिकअप पॉईंट)' : language === 'hi' ? 'पिकअप स्थान' : 'Village Pickup Point'}
            </Text>
            <TextInput
              style={styles.input}
              value={pickupHub}
              onChangeText={setPickupHub}
              placeholder="उदा. गावातील दूध डेअरी / मारुती मंदिर"
            />

            <Pressable
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.submitBtnText}>
                {loading
                  ? (language === 'mr' ? 'नोंदणी होत आहे...' : 'Posting...')
                  : (language === 'mr' ? 'गाडी फेरी प्रकाशित करा' : language === 'hi' ? 'फेरी पोस्ट करें' : 'Publish Trip')}
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
  submitBtn: {
    backgroundColor: Brand.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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
