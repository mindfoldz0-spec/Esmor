import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, Icons } from '@/components/app-icon';
import { TransportCard } from '@/components/transport/transport-card';
import { BookRideModal } from '@/components/transport/book-ride-modal';
import { PostRideModal } from '@/components/transport/post-ride-modal';
import { VehicleTrackingModal } from '@/components/transport/vehicle-tracking-modal';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { speakPrompt } from '@/lib/voice-player';
import { contentVoiceKey } from '@/lib/voice-service';
import {
  DEFAULT_USER_LOCATION,
  getRealUserLocation,
  matchRidesForUserLocation,
  geocodePlaceWithOsm,
} from '@/lib/mandi-location-service';
import { getCustomTransportRides, INITIAL_MAHARASHTRA_RIDES } from '@/lib/transport-store';
import type { GeoPoint, TransportRide, TransportBooking } from '@/types/transport';

type FilterTab = 'all' | 'nearby' | 'regional' | 'terminal' | 'pune' | 'nashik';

/** Merged list: user-posted rides first, then location-matched rides. */
async function fetchRidesForLocation(loc: GeoPoint): Promise<TransportRide[]> {
  const customRides = await getCustomTransportRides();
  const matchedRides = matchRidesForUserLocation(loc);
  const merged = [...customRides, ...matchedRides];
  return merged.length > 0 ? merged : INITIAL_MAHARASHTRA_RIDES;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { language, t } = useI18n();
  const { profile } = useAppData();

  const [userLocation, setUserLocation] = useState<GeoPoint>(DEFAULT_USER_LOCATION);
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [customVillageText, setCustomVillageText] = useState('');
  const [searchingVillage, setSearchingVillage] = useState(false);
  const [villageError, setVillageError] = useState<string | null>(null);

  const [rides, setRides] = useState<TransportRide[]>(INITIAL_MAHARASHTRA_RIDES);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const [selectedRideForBooking, setSelectedRideForBooking] = useState<TransportRide | null>(null);
  const [selectedRideForTracking, setSelectedRideForTracking] = useState<TransportRide | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<TransportBooking | null>(null);
  const [speakingHeader, setSpeakingHeader] = useState(false);

  // Initial load: resolve real user location and match nearby/regional/terminal mandis
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setDetectingLocation(true);
        const loc = await getRealUserLocation(profile?.location);
        if (!mounted) return;

        setUserLocation(loc);
        setIsLiveGps(loc.isLiveGps);
        setRides(await fetchRidesForLocation(loc));
      } finally {
        if (mounted) {
          setDetectingLocation(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [profile?.location]);

  const handleRefreshLocation = async () => {
    setDetectingLocation(true);
    try {
      const loc = await getRealUserLocation(profile?.location);
      setUserLocation(loc);
      setIsLiveGps(loc.isLiveGps);
      setRides(await fetchRidesForLocation(loc));
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSelectVillage = async (villageName: string) => {
    setSearchingVillage(true);
    setVillageError(null);
    try {
      const point = await geocodePlaceWithOsm(villageName);
      if (point) {
        setUserLocation(point);
        setIsLiveGps(false);
        setRides(await fetchRidesForLocation(point));
        setLocationPickerOpen(false);
      } else {
        setVillageError(t('transport.villageSearchError'));
      }
    } finally {
      setSearchingVillage(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleRefreshLocation();
    setRefreshing(false);
  };

  const handleHeaderVoice = async () => {
    try {
      setSpeakingHeader(true);
      const text = t('transport.voiceHeader', { place: userLocation.name });

      await speakPrompt(contentVoiceKey('transport_hub_header', text), language, text);
    } finally {
      setSpeakingHeader(false);
    }
  };

  const filteredRides = rides.filter((ride) => {
    // Filter chips
    if (activeFilter === 'nearby') {
      if (ride.mandiCategory !== 'nearby') return false;
    } else if (activeFilter === 'regional') {
      if (ride.mandiCategory !== 'regional') return false;
    } else if (activeFilter === 'terminal') {
      if (ride.mandiCategory !== 'terminal') return false;
    } else if (activeFilter === 'pune') {
      const isPune =
        ride.toMarket.toLowerCase().includes('पुणे') ||
        ride.toMarket.toLowerCase().includes('pune');
      if (!isPune) return false;
    } else if (activeFilter === 'nashik') {
      const isNashik =
        ride.toMarket.toLowerCase().includes('नाशिक') ||
        ride.toMarket.toLowerCase().includes('nashik');
      if (!isNashik) return false;
    }

    // Real-time search query across origin village, destination mandi, district, driver, and pickup hub
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      const matchesFrom = ride.fromVillage.toLowerCase().includes(q);
      const matchesTo = ride.toMarket.toLowerCase().includes(q);
      const matchesDistrict = ride.district.toLowerCase().includes(q);
      const matchesDriver = ride.driverName.toLowerCase().includes(q);
      const matchesHub = ride.pickupHub.toLowerCase().includes(q);
      if (!matchesFrom && !matchesTo && !matchesDistrict && !matchesDriver && !matchesHub) {
        return false;
      }
    }

    return true;
  });

  return (
    <View style={styles.screen}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.eyebrow}>{t('transport.eyebrow')}</Text>
            <Text style={styles.title}>{t('transport.title')}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={[styles.voiceBtn, speakingHeader && styles.voiceBtnActive]}
              onPress={handleHeaderVoice}
              accessibilityRole="button"
              accessibilityLabel="Listen overview in audio">
              <AppIcon
                name={Icons.sparkle}
                size={16}
                color={speakingHeader ? Brand.surface : Brand.accentInk}
              />
            </Pressable>

            <Pressable
              style={styles.postBtn}
              onPress={() => setPostModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Post empty vehicle">
              <AppIcon name={Icons.check} size={14} color={Brand.surface} />
              <Text style={styles.postBtnText}>{t('transport.postTrip')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Real User Location Match Banner */}
        <Pressable
          style={styles.locationCard}
          onPress={() => setLocationPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Change or refresh location">
          <View style={styles.locationCardLeft}>
            <View
              style={[
                styles.locationGpsDot,
                isLiveGps ? styles.dotLiveGps : styles.dotCachedGps,
              ]}
            />
            <View style={styles.locationTextWrap}>
              <View style={styles.locationHeaderRow}>
                <Text style={styles.locationTitle} numberOfLines={1}>
                  {userLocation.name}
                </Text>
                <View
                  style={[
                    styles.gpsBadge,
                    isLiveGps ? styles.gpsBadgeLive : styles.gpsBadgeManual,
                  ]}>
                  <Text
                    style={[
                      styles.gpsBadgeText,
                      isLiveGps ? styles.gpsBadgeTextLive : styles.gpsBadgeTextManual,
                    ]}>
                    {isLiveGps ? t('transport.gpsBadgeLive') : t('transport.gpsBadgeCached')}
                  </Text>
                </View>
              </View>
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {isLiveGps
                  ? t('transport.liveGpsSubtitle')
                  : t('transport.manualLocationSubtitle')}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.locationRefreshBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleRefreshLocation();
            }}
            accessibilityRole="button"
            accessibilityLabel="Refresh GPS location">
            {detectingLocation ? (
              <ActivityIndicator size="small" color={Brand.ink} />
            ) : (
              <AppIcon name={Icons.location} size={15} color={Brand.ink} />
            )}
          </Pressable>
        </Pressable>

        {/* Latest Booking Banner if any */}
        {latestBooking && (
          <View style={styles.bookingBanner}>
            <View style={styles.bookingBannerIcon}>
              <Text style={styles.partyIcon}>🎉</Text>
            </View>
            <View style={styles.bookingBannerText}>
              <Text style={styles.bookingBannerTitle}>
                {t('transport.bookingBannerTitle', { fare: latestBooking.totalFare })}
              </Text>
              <Text style={styles.bookingBannerSub}>
                {t('transport.bookingBannerSavings', {
                  savings: latestBooking.estimatedSavings,
                })}
              </Text>
            </View>

            <Pressable
              style={styles.trackBookingBtn}
              onPress={() => {
                const bookedRide =
                  rides.find((r) => r.id === latestBooking.rideId) ?? rides[0];
                if (bookedRide) {
                  setSelectedRideForTracking(bookedRide);
                }
              }}>
              <Text style={styles.trackBookingBtnText}>{t('transport.trackNow')}</Text>
            </Pressable>

            <Pressable onPress={() => setLatestBooking(null)} style={styles.dismissBtn}>
              <AppIcon name={Icons.close} size={14} color={Brand.inkMuted} />
            </Pressable>
          </View>
        )}

        {/* Search Bar for Mandi / Route */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <AppIcon name={Icons.search} size={18} color={Brand.inkMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('transport.searchPlaceholder')}
              placeholderTextColor={Brand.inkFaint}
              selectionColor={Brand.accent}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
              accessibilityLabel="Search transport trips"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={8}
                style={styles.searchClearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <AppIcon name={Icons.close} size={14} color={Brand.inkMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Route Filter Chips (Single horizontal scrollable line) */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filterScrollView}>
            <Pressable
              style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setActiveFilter('all')}>
              <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
                {t('transport.filterAll')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'nearby' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('nearby')}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'nearby' && styles.filterTextActive,
                ]}>
                {t('transport.filterNearby')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'regional' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('regional')}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'regional' && styles.filterTextActive,
                ]}>
                {t('transport.filterRegional')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'terminal' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('terminal')}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'terminal' && styles.filterTextActive,
                ]}>
                {t('transport.filterTerminal')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'pune' && styles.filterChipActive]}
              onPress={() => setActiveFilter('pune')}>
              <Text style={[styles.filterText, activeFilter === 'pune' && styles.filterTextActive]}>
                {t('transport.filterPune')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'nashik' && styles.filterChipActive]}
              onPress={() => setActiveFilter('nashik')}>
              <Text style={[styles.filterText, activeFilter === 'nashik' && styles.filterTextActive]}>
                {t('transport.filterNashik')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Rides List with Live Tracking */}
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransportCard
              ride={item}
              onBookPress={(r) => setSelectedRideForBooking(r)}
              onTrackPress={(r) => setSelectedRideForTracking(r)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 115 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🚚</Text>
              <Text style={styles.emptyTitle}>{t('transport.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('transport.emptySub')}</Text>
            </View>
          }
        />
      </View>

      {/* Location Picker / GPS Modal */}
      <Modal
        visible={locationPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLocationPickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('transport.pickerTitle')}</Text>
              <Pressable
                onPress={() => setLocationPickerOpen(false)}
                style={styles.pickerCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close location picker">
                <AppIcon name={Icons.close} size={15} color={Brand.ink} />
              </Pressable>
            </View>

            {/* Live GPS button */}
            <Pressable
              style={styles.useGpsBtn}
              onPress={() => {
                handleRefreshLocation();
                setLocationPickerOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Use live GPS location">
              <View style={styles.useGpsIcon}>
                <AppIcon name={Icons.location} size={16} color="#0E9F6E" />
              </View>
              <View style={styles.useGpsTextWrap}>
                <Text style={styles.useGpsTitle}>{t('transport.useGpsTitle')}</Text>
                <Text style={styles.useGpsSub}>{t('transport.useGpsSub')}</Text>
              </View>
            </Pressable>

            {/* Custom search village with OpenStreetMap */}
            <View style={styles.pickerSearchWrap}>
              <AppIcon name={Icons.search} size={16} color={Brand.inkMuted} />
              <TextInput
                value={customVillageText}
                onChangeText={setCustomVillageText}
                placeholder={t('transport.villageSearchPlaceholder')}
                placeholderTextColor={Brand.inkFaint}
                onSubmitEditing={() => {
                  if (customVillageText.trim().length > 1) {
                    handleSelectVillage(customVillageText.trim());
                  }
                }}
                returnKeyType="search"
                style={styles.pickerSearchInput}
              />
              {searchingVillage && <ActivityIndicator size="small" color={Brand.ink} />}
            </View>
            {villageError ? (
              <Text style={styles.villageErrorText} accessibilityLiveRegion="polite">
                {villageError}
              </Text>
            ) : null}

            {/* Popular quick villages/cities */}
            <Text style={styles.quickLabel}>{t('transport.quickSelectLabel')}</Text>
            <View style={styles.quickChipsWrap}>
              {[
                'पुणे (Pune)',
                'बारामती (Baramati)',
                'संगमनेर (Sangamner)',
                'जुन्नर (Junnar)',
                'नाशिक (Nashik)',
                'कोल्हापूर (Kolhapur)',
                'सांगली (Sangli)',
                'नवी मुंबई / वाशी (Vashi)',
                'अहमदनगर (Ahmednagar)',
                'सोलापूर (Solapur)',
              ].map((name) => (
                <Pressable
                  key={name}
                  style={styles.quickChip}
                  onPress={() => handleSelectVillage(name.split('(')[0].trim())}>
                  <Text style={styles.quickChipText}>{name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Book Space Modal */}
      <BookRideModal
        ride={selectedRideForBooking}
        visible={selectedRideForBooking !== null}
        onClose={() => setSelectedRideForBooking(null)}
        onBookingSuccess={(booking) => {
          setLatestBooking(booking);
        }}
      />

      {/* Post Vehicle Modal */}
      <PostRideModal
        visible={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onRideCreated={(newRide) => {
          setRides((prev) => [newRide, ...prev]);
        }}
      />

      {/* Live Vehicle Tracking Modal with Headless OpenStreetMap */}
      <VehicleTrackingModal
        ride={selectedRideForTracking}
        visible={selectedRideForTracking !== null}
        onClose={() => setSelectedRideForTracking(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitles: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.accentInk,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.ink,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: Brand.accent,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.ink,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
  },
  postBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.surface,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  locationCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  locationGpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLiveGps: {
    backgroundColor: '#10B981',
  },
  dotCachedGps: {
    backgroundColor: '#3B82F6',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
    flexShrink: 1,
  },
  gpsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gpsBadgeLive: {
    backgroundColor: '#DEF7EC',
  },
  gpsBadgeManual: {
    backgroundColor: '#E0E7FF',
  },
  gpsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  gpsBadgeTextLive: {
    color: '#0E9F6E',
  },
  gpsBadgeTextManual: {
    color: '#3730A3',
  },
  locationSubtitle: {
    fontSize: 10,
    color: Brand.inkMuted,
    marginTop: 1,
  },
  locationRefreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#34A853',
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  bookingBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyIcon: {
    fontSize: 15,
  },
  bookingBannerText: {
    flex: 1,
  },
  bookingBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#137333',
  },
  bookingBannerSub: {
    fontSize: 10,
    color: '#137333',
    marginTop: 1,
  },
  trackBookingBtn: {
    backgroundColor: '#137333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trackBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  searchBar: {
    height: 46,
    borderRadius: 14,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#16131F',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'solid' as const, outlineWidth: 0 } }),
  },
  searchClearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 19, 31, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    marginBottom: 8,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingHorizontal: 18,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: Brand.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  filterChipActive: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.inkMuted,
  },
  filterTextActive: {
    color: Brand.surface,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  emptyCard: {
    backgroundColor: Brand.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Brand.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 19, 31, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.ink,
  },
  pickerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#31C48D',
  },
  useGpsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  useGpsTextWrap: {
    flex: 1,
  },
  useGpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#03543F',
  },
  useGpsSub: {
    fontSize: 10,
    color: '#046C4E',
    marginTop: 2,
  },
  pickerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  pickerSearchInput: {
    flex: 1,
    height: '100%',
    color: Brand.ink,
    fontSize: 13,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'solid' as const, outlineWidth: 0 } }),
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.inkMuted,
    textTransform: 'uppercase',
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  quickChip: {
    backgroundColor: Brand.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.ink,
  },
  villageErrorText: {
    color: Brand.danger,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: -6,
    paddingHorizontal: 4,
  },
});
