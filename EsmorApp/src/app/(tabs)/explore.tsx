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
import {
  DEFAULT_USER_LOCATION,
  getRealUserLocation,
  matchRidesForUserLocation,
  geocodePlaceWithOsm,
} from '@/lib/mandi-location-service';
import { getAllTransportRides, INITIAL_MAHARASHTRA_RIDES } from '@/lib/transport-store';
import type { GeoPoint, TransportRide, TransportBooking } from '@/types/transport';

type FilterTab = 'all' | 'nearby' | 'regional' | 'terminal' | 'pune' | 'nashik';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useI18n();
  const { profile } = useAppData();

  const [userLocation, setUserLocation] = useState<GeoPoint>(DEFAULT_USER_LOCATION);
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [customVillageText, setCustomVillageText] = useState('');
  const [searchingVillage, setSearchingVillage] = useState(false);

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

        // Fetch DB rides & generate location-tailored rides
        const customDbRides = await getAllTransportRides();
        const matchedRides = matchRidesForUserLocation(loc);

        // Custom user-posted rides first, then dynamic location-matched rides
        const merged = [
          ...customDbRides.filter((r) => r.id.startsWith('custom-')),
          ...matchedRides,
        ];

        setRides(merged.length > 0 ? merged : INITIAL_MAHARASHTRA_RIDES);
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
      const customDbRides = await getAllTransportRides();
      const matchedRides = matchRidesForUserLocation(loc);
      const merged = [
        ...customDbRides.filter((r) => r.id.startsWith('custom-')),
        ...matchedRides,
      ];
      setRides(merged);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSelectVillage = async (villageName: string) => {
    setSearchingVillage(true);
    try {
      const point = await geocodePlaceWithOsm(villageName);
      if (point) {
        setUserLocation(point);
        setIsLiveGps(false);
        const customDbRides = await getAllTransportRides();
        const matchedRides = matchRidesForUserLocation(point);
        const merged = [
          ...customDbRides.filter((r) => r.id.startsWith('custom-')),
          ...matchedRides,
        ];
        setRides(merged);
        setLocationPickerOpen(false);
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
      const text =
        language === 'mr'
          ? `सामाईक वाहतूक सेवा. तुमचे स्थान ${userLocation.name} असून ओपन मॅप्स द्वारे जवळपासच्या आणि मोठ्या बाजार समित्या जोडल्या आहेत. गाडी निवडून जागा बुक करा किंवा थेट लाईव्ह ट्रॅक करा.`
          : language === 'hi'
            ? `साझा वाहन सेवा। आपका स्थान ${userLocation.name} है और ओपन मैप्स द्वारा नजदीकी व बड़ी मंडियां जोड़ी गई हैं। जगह बुक करें या लाइव ट्रैक करें।`
            : `Shared Transport. Your location is ${userLocation.name}. Matched with nearby and terminal mandis via OpenStreetMap. Book space or track vehicles live.`;

      await speakPrompt('transport_hub_header', language, text);
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
            <Text style={styles.eyebrow}>
              {language === 'mr'
                ? 'ओपनमॅप्स मालवाहतूक पूल'
                : language === 'hi'
                  ? 'ओपनमैप्स माल ढुलाई पूल'
                  : 'OpenMaps Freight Pooling'}
            </Text>
            <Text style={styles.title}>
              {language === 'mr'
                ? 'सामाईक वाहतूक'
                : language === 'hi'
                  ? 'साझा वाहन सेवा'
                  : 'Shared Transport'}
            </Text>
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
              <Text style={styles.postBtnText}>
                {language === 'mr' ? '+ माझी गाडी' : language === 'hi' ? '+ मेरी गाड़ी' : '+ Post Trip'}
              </Text>
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
                    {isLiveGps ? '● LIVE GPS' : '📍 LOCATION'}
                  </Text>
                </View>
              </View>
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {isLiveGps
                  ? language === 'mr'
                    ? 'थेट फोन GPS द्वारे बाजार जोडले (बदलण्यासाठी टॅप करा)'
                    : 'Matched via phone live GPS (Tap to change)'
                  : language === 'mr'
                    ? 'स्थान बदलण्यासाठी किंवा थेट GPS घेण्यासाठी येथे टॅप करा'
                    : 'Tap to refresh GPS or select your village'}
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
                {language === 'mr'
                  ? `जागा निश्चित! ₹${latestBooking.totalFare} मध्ये`
                  : `Space Confirmed for ₹${latestBooking.totalFare}`}
              </Text>
              <Text style={styles.bookingBannerSub}>
                {language === 'mr'
                  ? `टेम्पोपेक्षा तुमची ₹${latestBooking.estimatedSavings} बचत झाली!`
                  : `You saved ₹${latestBooking.estimatedSavings}!`}
              </Text>
            </View>

            <Pressable
              style={styles.trackBookingBtn}
              onPress={() => {
                const bookedRide =
                  rides.find((r) => r.id === latestBooking.rideId) || rides[0];
                setSelectedRideForTracking(bookedRide);
              }}>
              <Text style={styles.trackBookingBtnText}>
                {language === 'mr' ? 'थेट ट्रॅक' : 'Track'}
              </Text>
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
              placeholder={
                language === 'mr'
                  ? 'बाजार समिती, गाव किंवा जिल्हा शोधा...'
                  : language === 'hi'
                    ? 'मंडी, गांव या जिला खोजें...'
                    : 'Search mandi, village, or route...'
              }
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
                {language === 'mr' ? 'सर्व फेऱ्या' : language === 'hi' ? 'सभी फेरियां' : 'All Trips'}
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
                {language === 'mr' ? '🟢 जवळची मंडी (<45 km)' : '🟢 Nearby (<45 km)'}
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
                {language === 'mr' ? '🟡 जिल्हा मंडी (45-110 km)' : '🟡 Regional APMC'}
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
                {language === 'mr' ? '🔵 मोठी मंडी (>110 km)' : '🔵 Terminal Mandi'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'pune' && styles.filterChipActive]}
              onPress={() => setActiveFilter('pune')}>
              <Text style={[styles.filterText, activeFilter === 'pune' && styles.filterTextActive]}>
                {language === 'mr' ? 'पुणे मार्केट' : 'Pune Mandi'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'nashik' && styles.filterChipActive]}
              onPress={() => setActiveFilter('nashik')}>
              <Text style={[styles.filterText, activeFilter === 'nashik' && styles.filterTextActive]}>
                {language === 'mr' ? 'नाशिक APMC' : 'Nashik APMC'}
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
              <Text style={styles.emptyTitle}>
                {language === 'mr'
                  ? 'या मार्गावर सध्या गाड्या उपलब्ध नाहीत'
                  : 'No trips found for this search'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'mr'
                  ? 'तुमची स्वतःची गाडी नोंदवून इतरांना सोबत घेऊन उत्पन्न मिळवा किंवा वेगळा शोध घ्या.'
                  : 'Try searching another market or post your own vehicle to earn freight income.'}
              </Text>
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
              <Text style={styles.pickerTitle}>
                {language === 'mr' ? 'तुमचे स्थान निवडा' : 'Select Your Location'}
              </Text>
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
                <Text style={styles.useGpsTitle}>
                  {language === 'mr' ? '🎯 थेट GPS स्थान वापरा (Live GPS)' : '🎯 Use Live Phone GPS'}
                </Text>
                <Text style={styles.useGpsSub}>
                  {language === 'mr'
                    ? 'चालू GPS द्वारे जवळच्या बाजार समित्यांचे अंतर मोजा'
                    : 'Detect current location and recalculate distance to all Mandis'}
                </Text>
              </View>
            </Pressable>

            {/* Custom search village with OpenStreetMap */}
            <View style={styles.pickerSearchWrap}>
              <AppIcon name={Icons.search} size={16} color={Brand.inkMuted} />
              <TextInput
                value={customVillageText}
                onChangeText={setCustomVillageText}
                placeholder={
                  language === 'mr'
                    ? 'गावाचे किंवा तालुक्याचे नाव शोधा...'
                    : 'Search village, taluka, or city...'
                }
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

            {/* Popular quick villages/cities */}
            <Text style={styles.quickLabel}>
              {language === 'mr' ? 'लोकप्रिय गावे / शहरे (Quick Select):' : 'Popular Regions:'}
            </Text>
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
});
