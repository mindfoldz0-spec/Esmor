import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Linking } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { speakPrompt } from '@/lib/voice-player';
import type { TransportRide } from '@/types/transport';

type TransportCardProps = {
  ride: TransportRide;
  onBookPress: (ride: TransportRide) => void;
  onTrackPress?: (ride: TransportRide) => void;
};

const VEHICLE_LABELS: Record<string, { en: string; hi: string; mr: string; icon: string }> = {
  tata_ace: { en: 'Tata Ace (Chhota Hathi)', hi: 'छोटा हाथी (टाटा एस)', mr: 'छोटा हत्ती (टाटा एस)', icon: '🚚' },
  bolero_pickup: { en: 'Bolero Maxi Truck', hi: 'बोलेरो पिकअप', mr: 'बोलेरो पिकअप ट्रक', icon: '🛻' },
  tractor: { en: 'Tractor Trolley', hi: 'ट्रैक्टर ट्रॉली', mr: 'ट्रॅक्टर ट्रॉली', icon: '🚜' },
  three_wheeler: { en: '3-Wheeler Cargo', hi: 'मालवाहक ऑटो', mr: 'मालवाहू रिक्षा', icon: '🛺' },
};

function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '';
  const match = timeStr.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return timeStr.trim();
}

export function TransportCard({ ride, onBookPress, onTrackPress }: TransportCardProps) {
  const { language } = useI18n();
  const [speakingThis, setSpeakingThis] = useState(false);

  const vehicleInfo = VEHICLE_LABELS[ride.vehicleType] ?? {
    en: 'Freight Vehicle',
    hi: 'मालवाहक वाहन',
    mr: 'मालवाहू गाडी',
    icon: '🚚',
  };

  const handleSpeak = async () => {
    try {
      setSpeakingThis(true);
      const summaryText =
        language === 'mr'
          ? ride.voiceSummary.mr
          : language === 'hi'
            ? ride.voiceSummary.hi
            : ride.voiceSummary.en;

      await speakPrompt(`transport_${ride.id}`, language, summaryText);
    } finally {
      setSpeakingThis(false);
    }
  };

  const handleCall = () => {
    const cleanPhone = ride.driverPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  return (
    <View style={styles.card}>
      {/* Route & Vehicle Header */}
      <View style={styles.headerRow}>
        <View style={styles.vehicleBadge}>
          <Text style={styles.vehicleIcon}>{vehicleInfo.icon}</Text>
          <Text style={styles.vehicleText}>
            {language === 'mr' ? vehicleInfo.mr : language === 'hi' ? vehicleInfo.hi : vehicleInfo.en}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {ride.mandiCategory && (
            <View
              style={[
                styles.categoryBadge,
                ride.mandiCategory === 'nearby' && styles.categoryNearby,
                ride.mandiCategory === 'regional' && styles.categoryRegional,
                ride.mandiCategory === 'terminal' && styles.categoryTerminal,
              ]}>
              <Text
                style={[
                  styles.categoryText,
                  ride.mandiCategory === 'nearby' && styles.categoryTextNearby,
                  ride.mandiCategory === 'regional' && styles.categoryTextRegional,
                  ride.mandiCategory === 'terminal' && styles.categoryTextTerminal,
                ]}>
                {ride.mandiCategory === 'nearby'
                  ? language === 'mr' ? 'जवळची मंडी' : 'Nearby'
                  : ride.mandiCategory === 'regional'
                    ? language === 'mr' ? 'जिल्हा मंडी' : 'Regional'
                    : language === 'mr' ? 'मोठी मंडी' : 'Terminal'}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.listenBtn, speakingThis && styles.listenBtnActive]}
            onPress={handleSpeak}
            accessibilityRole="button"
            accessibilityLabel="Listen ride details">
            <AppIcon
              name={Icons.sparkle}
              size={14}
              color={speakingThis ? Brand.surface : Brand.accentInk}
            />
            <Text style={[styles.listenBtnText, speakingThis && styles.listenBtnTextActive]}>
              {language === 'mr' ? 'ऐका' : language === 'hi' ? 'सुनें' : 'Listen'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Origin -> Destination Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, styles.dotOrigin]} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>
              {language === 'mr' ? 'निघण्याचे ठिकाण' : language === 'hi' ? 'रवानगी' : 'From'}
            </Text>
            <Text style={styles.routeTitle}>{ride.fromVillage}</Text>
          </View>
        </View>

        <View style={styles.routeDivider} />

        <View style={styles.routePoint}>
          <View style={[styles.dot, styles.dotDestination]} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>
              {language === 'mr' ? 'पोहोचण्याचे ठिकाण (मार्केट)' : language === 'hi' ? 'गंतव्य (मंडी)' : 'To (Mandi)'}
            </Text>
            <Text style={styles.routeTitle}>{ride.toMarket}</Text>
          </View>
        </View>
      </View>

      {/* Departure, Distance, and Hub Info */}
      <View style={styles.timingRow}>
        <View style={styles.timingItem}>
          <Text style={styles.timingLabel}>
            {language === 'mr' ? 'वेळ' : language === 'hi' ? 'समय' : 'Time'}
          </Text>
          <Text style={styles.timingValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatDisplayTime(ride.departureTime)}
          </Text>
        </View>

        <View style={styles.timingDivider} />

        <View style={styles.timingItem}>
          <Text style={styles.timingLabel}>
            {language === 'mr' ? 'अंतर' : language === 'hi' ? 'दूरी' : 'Distance'}
          </Text>
          <Text style={styles.timingValue} numberOfLines={1} adjustsFontSizeToFit>
            ~{ride.estimatedMarketDistanceKm} km
          </Text>
        </View>

        <View style={styles.timingDivider} />

        <View style={styles.timingItem}>
          <Text style={styles.timingLabel}>
            {language === 'mr' ? 'भाडे' : language === 'hi' ? 'किराया' : 'Fare'}
          </Text>
          <Text style={styles.fareHighlight} numberOfLines={1} adjustsFontSizeToFit>
            ₹{ride.farePerUnit}
            <Text style={styles.fareUnit}>/{ride.unitType}</Text>
          </Text>
        </View>
      </View>

      {/* Space Availability Gauge */}
      <View style={styles.capacitySection}>
        <View style={styles.capacityHeader}>
          <Text style={styles.capacityTitle}>
            {language === 'mr'
              ? 'उपलब्ध मालवाहतूक जागा'
              : language === 'hi'
                ? 'उपलब्ध खाली जगह'
                : 'Free Cargo Space'}
          </Text>
          <Text style={styles.capacityPercent}>
            {ride.availableCapacityPercent}% ({ride.availableWeightKg} kg)
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(100, ride.availableCapacityPercent)}%` },
            ]}
          />
        </View>
      </View>

      {/* Hub location note */}
      <View style={styles.hubBox}>
        <AppIcon name={Icons.location} size={14} color={Brand.inkMuted} />
        <Text style={styles.hubText} numberOfLines={1}>
          {ride.pickupHub}
        </Text>
      </View>

      {/* Bottom Actions: Call Driver + Track Vehicle + Book Space */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.callBtn}
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel="Call driver">
          <AppIcon name={Icons.phone} size={15} color={Brand.ink} />
          <Text style={styles.callBtnText}>
            {language === 'mr' ? 'कॉल' : language === 'hi' ? 'कॉल' : 'Call'}
          </Text>
        </Pressable>

        {onTrackPress && (
          <Pressable
            style={styles.trackBtn}
            onPress={() => onTrackPress(ride)}
            accessibilityRole="button"
            accessibilityLabel="Track vehicle live">
            <AppIcon name={Icons.location} size={15} color={Brand.surface} />
            <Text style={styles.trackBtnText}>
              {language === 'mr' ? 'थेट ट्रॅक' : language === 'hi' ? 'लाइव ट्रैक' : 'Track'}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.bookBtn}
          onPress={() => onBookPress(ride)}
          accessibilityRole="button"
          accessibilityLabel="Book space in this ride">
          <Text style={styles.bookBtnText}>
            {language === 'mr'
              ? 'जागा बुक करा'
              : language === 'hi'
                ? 'जगह बुक करें'
                : 'Book Space'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
    shadowColor: '#16131F',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryNearby: {
    backgroundColor: '#DEF7EC',
  },
  categoryRegional: {
    backgroundColor: '#FEF08A',
  },
  categoryTerminal: {
    backgroundColor: '#E0E7FF',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryTextNearby: {
    color: '#03543F',
  },
  categoryTextRegional: {
    color: '#854D0E',
  },
  categoryTextTerminal: {
    color: '#3730A3',
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  vehicleIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  listenBtnActive: {
    backgroundColor: Brand.accent,
  },
  listenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.accentInk,
  },
  listenBtnTextActive: {
    color: Brand.surface,
  },
  routeContainer: {
    backgroundColor: Brand.surfaceTint,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 10,
  },
  dotOrigin: {
    backgroundColor: '#34A853',
  },
  dotDestination: {
    backgroundColor: '#EA4335',
  },
  routeDivider: {
    width: 2,
    height: 14,
    backgroundColor: Brand.inkFaint,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Brand.inkMuted,
    textTransform: 'uppercase',
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
    marginTop: 1,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  timingItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  timingLabel: {
    fontSize: 10,
    color: Brand.inkMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
    marginTop: 3,
    textAlign: 'center',
  },
  timingDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(22, 19, 31, 0.1)',
  },
  fareHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F9D58',
    marginTop: 3,
    textAlign: 'center',
  },
  fareUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Brand.inkMuted,
  },
  capacitySection: {
    marginBottom: 10,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  capacityTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.inkMuted,
  },
  capacityPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
  },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(22, 19, 31, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Brand.accent,
    borderRadius: 4,
  },
  hubBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 14,
    gap: 6,
  },
  hubText: {
    fontSize: 11,
    color: Brand.inkMuted,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceMuted,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.12)',
    gap: 4,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 5,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.surface,
  },
  bookBtn: {
    flex: 1,
    backgroundColor: Brand.ink,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.surface,
  },
});
