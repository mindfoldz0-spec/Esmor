import { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { HeadlessMapView } from '@/components/transport/headless-map-view';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { fetchOsrmRoadRoute } from '@/lib/mandi-location-service';
import { speakPrompt } from '@/lib/voice-player';
import type { RoutePoint, TrackingPhase, TransportRide } from '@/types/transport';

type VehicleTrackingModalProps = {
  ride: TransportRide | null;
  visible: boolean;
  onClose: () => void;
};

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function VehicleTrackingModal({
  ride,
  visible,
  onClose,
}: VehicleTrackingModalProps) {
  const { language } = useI18n();

  const [phase, setPhase] = useState<TrackingPhase>('approaching_source');
  const [approachPoints, setApproachPoints] = useState<RoutePoint[]>([]);
  const [mandiPoints, setMandiPoints] = useState<RoutePoint[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [speaking, setSpeaking] = useState<boolean>(false);

  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup default coordinates if not present on ride
  const sourceCoords = ride?.fromCoords || {
    latitude: 18.3388,
    longitude: 74.3773,
    name: ride?.fromVillage || 'सुपा / बारामती (Supa, Baramati)',
  };

  const destCoords = ride?.toCoords || {
    latitude: 18.4905,
    longitude: 73.8643,
    name: ride?.toMarket || 'पुणे मार्केट यार्ड (Pune Market Yard)',
  };

  const depotCoords = ride?.depotCoords || {
    latitude: sourceCoords.latitude - 0.024,
    longitude: sourceCoords.longitude + 0.028,
    name: 'वाहन डेपो / मूळ तळ',
  };

  // Load OSRM routes when modal opens
  useEffect(() => {
    if (!visible || !ride) return;

    let mounted = true;
    const depLat = depotCoords.latitude;
    const depLon = depotCoords.longitude;
    const srcLat = sourceCoords.latitude;
    const srcLon = sourceCoords.longitude;
    const dstLat = destCoords.latitude;
    const dstLon = destCoords.longitude;

    async function loadRoutes() {
      const [res1, res2] = await Promise.all([
        fetchOsrmRoadRoute(depLat, depLon, srcLat, srcLon),
        fetchOsrmRoadRoute(srcLat, srcLon, dstLat, dstLon),
      ]);
      if (mounted) {
        setApproachPoints(res1.coordinates);
        setMandiPoints(res2.coordinates);
        setProgressPercent(15);
        setPhase('approaching_source');
        setIsPlaying(true);
      }
    }

    loadRoutes();

    return () => {
      mounted = false;
    };
  }, [
    visible,
    ride,
    depotCoords.latitude,
    depotCoords.longitude,
    sourceCoords.latitude,
    sourceCoords.longitude,
    destCoords.latitude,
    destCoords.longitude,
  ]);

  // Active route points for current phase
  const activePoints = phase === 'approaching_source' ? approachPoints : mandiPoints;

  // Animation ticker for vehicle movement
  useEffect(() => {
    if (!visible || !isPlaying || activePoints.length === 0) {
      if (animRef.current) clearInterval(animRef.current);
      return;
    }

    const intervalMs = 250 / simulationSpeed;
    animRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 98) {
          // If in phase 1 and completed, switch to phase 2 automatically!
          if (phase === 'approaching_source') {
            setPhase('en_route_mandi');
            return 5;
          }
          return 98; // Stay near end of mandi route
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [visible, isPlaying, simulationSpeed, phase, activePoints.length]);

  if (!ride) return null;

  // Calculate current vehicle position from progress
  const pointsCount = activePoints.length;
  let vehicleLat = sourceCoords.latitude;
  let vehicleLon = sourceCoords.longitude;
  let heading = 45;

  if (pointsCount >= 2) {
    const rawIdx = (progressPercent / 100) * (pointsCount - 1);
    const currIdx = Math.min(pointsCount - 2, Math.floor(rawIdx));
    const nextIdx = currIdx + 1;
    const fraction = rawIdx - currIdx;

    const p1 = activePoints[currIdx];
    const p2 = activePoints[nextIdx];

    vehicleLon = p1[0] + (p2[0] - p1[0]) * fraction;
    vehicleLat = p1[1] + (p2[1] - p1[1]) * fraction;

    heading = calculateBearing(p1[1], p1[0], p2[1], p2[0]);
  }

  // Calculate live remaining distance & ETA
  const totalPhaseDistanceKm =
    phase === 'approaching_source' ? 4 : ride.estimatedMarketDistanceKm;
  const remainingDistanceKm = Math.max(
    0.3,
    Number((totalPhaseDistanceKm * (1 - progressPercent / 100)).toFixed(1))
  );

  const speedKmH =
    phase === 'approaching_source' ? 32 + (simulationSpeed > 1 ? 10 : 0) : 48;
  const etaMinutes = Math.max(1, Math.round((remainingDistanceKm / speedKmH) * 60));

  const handleCallDriver = () => {
    const cleanPhone = ride.driverPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleVoiceUpdate = async () => {
    try {
      setSpeaking(true);
      const text =
        phase === 'approaching_source'
          ? language === 'mr'
            ? `गाडी सध्या तुमच्या संकलन केंद्राकडे येत असून सुमारे ${remainingDistanceKm} किलोमीटर अंतरावर आहे. अंदाजे ${etaMinutes} मिनिटांत पोहोचेल.`
            : `Vehicle is approaching your pickup hub, approximately ${remainingDistanceKm} km away. Arriving in ${etaMinutes} minutes.`
          : language === 'mr'
            ? `गाडी मार्केट यार्डकडे निघाली असून सुरक्षित वेगाने जात आहे. मार्केटपर्यंत ${remainingDistanceKm} किलोमीटर शिल्लक असून अंदाजे ${etaMinutes} मिनिटे लागतील.`
            : `Vehicle is en route to ${ride.toMarket}. ${remainingDistanceKm} km remaining, arriving in ${etaMinutes} minutes.`;

      await speakPrompt(`track_${ride.id}_${phase}`, language, text);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>GPS LIVE</Text>
              </View>
              <Text style={styles.headerTitle}>
                {language === 'mr'
                  ? 'थेट वाहन ट्रॅकिंग'
                  : language === 'hi'
                    ? 'लाइव वाहन ट्रैकिंग'
                    : 'Live Vehicle Tracking'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close tracking">
              <AppIcon name={Icons.close} size={16} color={Brand.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            {/* Journey Phase Toggle (Approaching Source ⇄ En Route Mandi) */}
            <View style={styles.phaseSelector}>
              <Pressable
                style={[
                  styles.phaseTab,
                  phase === 'approaching_source' && styles.phaseTabActive,
                ]}
                onPress={() => {
                  setPhase('approaching_source');
                  setProgressPercent(20);
                }}>
                <Text
                  style={[
                    styles.phaseTabText,
                    phase === 'approaching_source' && styles.phaseTabTextActive,
                  ]}>
                  {language === 'mr' ? '१. पिकअप पॉईंटकडे' : '1. To Pickup Hub'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.phaseTab,
                  phase === 'en_route_mandi' && styles.phaseTabActive,
                ]}
                onPress={() => {
                  setPhase('en_route_mandi');
                  setProgressPercent(15);
                }}>
                <Text
                  style={[
                    styles.phaseTabText,
                    phase === 'en_route_mandi' && styles.phaseTabTextActive,
                  ]}>
                  {language === 'mr' ? '२. मार्केट यार्डकडे' : '2. To Mandi'}
                </Text>
              </Pressable>
            </View>

            {/* Headless Map Canvas with moving vehicle */}
            <View style={styles.mapWrapper}>
              <HeadlessMapView
                routePoints={
                  activePoints.length > 0
                    ? activePoints
                    : [
                        [sourceCoords.longitude, sourceCoords.latitude],
                        [destCoords.longitude, destCoords.latitude],
                      ]
                }
                vehiclePosition={{ latitude: vehicleLat, longitude: vehicleLon }}
                headingDegrees={heading}
                vehicleType={ride.vehicleType}
                sourcePoint={sourceCoords}
                destinationPoint={
                  phase === 'approaching_source' ? sourceCoords : destCoords
                }
                phase={phase}
                progressPercent={progressPercent}
                width={330}
                height={230}
              />
            </View>

            {/* Simulation Controls: Play/Pause & Speed */}
            <View style={styles.simControls}>
              <Pressable
                style={styles.playBtn}
                onPress={() => setIsPlaying(!isPlaying)}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause simulation' : 'Play simulation'}>
                <Text style={styles.playBtnText}>{isPlaying ? '⏸ विराम (Pause)' : '▶ सुरू (Play)'}</Text>
              </Pressable>

              <View style={styles.speedRow}>
                {[1, 2, 5].map((spd) => (
                  <Pressable
                    key={spd}
                    style={[
                      styles.speedChip,
                      simulationSpeed === spd && styles.speedChipActive,
                    ]}
                    onPress={() => setSimulationSpeed(spd)}>
                    <Text
                      style={[
                        styles.speedText,
                        simulationSpeed === spd && styles.speedTextActive,
                      ]}>
                      {spd}x
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.voiceBtn, speaking && styles.voiceBtnActive]}
                onPress={handleVoiceUpdate}
                accessibilityRole="button"
                accessibilityLabel="Listen tracking update">
                <AppIcon
                  name={Icons.sparkle}
                  size={14}
                  color={speaking ? Brand.surface : Brand.accentInk}
                />
                <Text
                  style={[
                    styles.voiceBtnText,
                    speaking && styles.voiceBtnTextActive,
                  ]}>
                  {language === 'mr' ? 'ऐका' : 'Listen'}
                </Text>
              </Pressable>
            </View>

            {/* Live Metrics Cards: Distance, Speed, ETA */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  {language === 'mr' ? 'शिल्लक अंतर' : 'Remaining'}
                </Text>
                <Text style={styles.metricValue}>{remainingDistanceKm} km</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  {language === 'mr' ? 'अंदाजे वेळ (ETA)' : 'ETA'}
                </Text>
                <Text style={styles.metricValue}>{etaMinutes} min</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  {language === 'mr' ? 'थेट वेग' : 'Speed'}
                </Text>
                <Text style={styles.metricValueHighlight}>{speedKmH} km/h</Text>
              </View>
            </View>

            {/* Route Status Summary */}
            <View style={styles.statusBox}>
              <View style={styles.statusIndicator} />
              <View style={styles.statusTextWrap}>
                <Text style={styles.statusTitle}>
                  {phase === 'approaching_source'
                    ? language === 'mr'
                      ? `गाडी तुमच्या पिकअप पॉईंटकडे येत आहे (${sourceCoords.name.split(',')[0]})`
                      : `Approaching your pickup hub (${sourceCoords.name.split(',')[0]})`
                    : language === 'mr'
                      ? `हायवेवर मार्केट यार्डकडे प्रवास सुरू (${destCoords.name.split(',')[0]})`
                      : `En route to Mandi on highway (${destCoords.name.split(',')[0]})`}
                </Text>
                <Text style={styles.statusSub}>
                  {language === 'mr'
                    ? `ड्रायव्हर: ${ride.driverName} • ${ride.vehicleNumber}`
                    : `Driver: ${ride.driverName} • ${ride.vehicleNumber}`}
                </Text>
              </View>
            </View>

            {/* Direct Driver Contact Action */}
            <View style={styles.driverBar}>
              <View style={styles.driverMeta}>
                <Text style={styles.driverIcon}>🧑‍🌾</Text>
                <View>
                  <Text style={styles.driverName}>{ride.driverName}</Text>
                  <Text style={styles.driverSub}>
                    {ride.pickupHub}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.callDriverBtn}
                onPress={handleCallDriver}
                accessibilityRole="button"
                accessibilityLabel="Call driver directly">
                <AppIcon name={Icons.phone} size={15} color={Brand.surface} />
                <Text style={styles.callDriverText}>
                  {language === 'mr' ? 'कॉल करा' : 'Call'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 19, 31, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 19, 31, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E9F6E',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E9F6E',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
  },
  phaseSelector: {
    flexDirection: 'row',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  phaseTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  phaseTabActive: {
    backgroundColor: Brand.surface,
    shadowColor: '#16131F',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  phaseTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.inkMuted,
  },
  phaseTabTextActive: {
    color: Brand.ink,
    fontWeight: '800',
  },
  mapWrapper: {
    alignItems: 'center',
  },
  simControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Brand.surface,
  },
  playBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.ink,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 5,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(22, 19, 31, 0.06)',
  },
  speedChipActive: {
    backgroundColor: Brand.ink,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.inkMuted,
  },
  speedTextActive: {
    color: Brand.surface,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  voiceBtnActive: {
    backgroundColor: Brand.accent,
  },
  voiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.accentInk,
  },
  voiceBtnTextActive: {
    color: Brand.surface,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: Brand.inkMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.ink,
    marginTop: 3,
  },
  metricValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F9D58',
    marginTop: 3,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
    marginTop: 3,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    lineHeight: 17,
  },
  statusSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  driverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    padding: 12,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  driverIcon: {
    fontSize: 22,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
  },
  driverSub: {
    fontSize: 11,
    color: Brand.inkMuted,
    marginTop: 1,
  },
  callDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.ink,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  callDriverText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.surface,
  },
});
