import { useEffect, useState } from 'react';
import {
  FlatList,
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
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { speakPrompt } from '@/lib/voice-player';
import { getAllTransportRides, INITIAL_MAHARASHTRA_RIDES } from '@/lib/transport-store';
import type { TransportRide, TransportBooking } from '@/types/transport';

type FilterTab = 'all' | 'pune' | 'nashik' | 'vashi' | 'sangli';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useI18n();
  const [rides, setRides] = useState<TransportRide[]>(INITIAL_MAHARASHTRA_RIDES);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedRideForBooking, setSelectedRideForBooking] = useState<TransportRide | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<TransportBooking | null>(null);
  const [speakingHeader, setSpeakingHeader] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAllTransportRides().then((list) => {
      if (mounted) {
        setRides(list);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const list = await getAllTransportRides();
    setRides(list);
    setRefreshing(false);
  };

  const handleHeaderVoice = async () => {
    try {
      setSpeakingHeader(true);
      const text =
        language === 'mr'
          ? 'सामाईक वाहतूक सेवा. तुमच्या गावापासून बाजार समितीपर्यंत रिकाम्या गाड्यांची जागा एकत्र करून ५० ते ७० टक्के वाहतूक खर्च वाचवा. खालीलपैकी योग्य गाडी निवडून जागा बुक करा.'
          : language === 'hi'
            ? 'साझा परिवहन सेवा। अपने गांव से मंडी तक खाली गाड़ियों की जगह साझा करके ५० से ७० प्रतिशत परिवहन खर्च बचाएं। नीचे दी गई गाड़ियों में जगह बुक करें।'
            : 'Shared Rural Freight Transport. Pool empty vehicle space from your village to mandi and save 50 to 70 percent on transportation costs.';

      await speakPrompt('transport_hub_header', language, text);
    } finally {
      setSpeakingHeader(false);
    }
  };

  const filteredRides = rides.filter((ride) => {
    // Category pill filter
    if (activeFilter === 'pune') {
      const isPune = ride.toMarket.toLowerCase().includes('पुणे') || ride.toMarket.toLowerCase().includes('pune');
      if (!isPune) return false;
    } else if (activeFilter === 'nashik') {
      const isNashik = ride.toMarket.toLowerCase().includes('नाशिक') || ride.toMarket.toLowerCase().includes('nashik');
      if (!isNashik) return false;
    } else if (activeFilter === 'vashi') {
      const isVashi = ride.toMarket.toLowerCase().includes('वाशी') || ride.toMarket.toLowerCase().includes('vashi');
      if (!isVashi) return false;
    } else if (activeFilter === 'sangli') {
      const isSangli = ride.toMarket.toLowerCase().includes('सांगली') || ride.toMarket.toLowerCase().includes('sangli');
      if (!isSangli) return false;
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
                ? 'ग्रामीण मालवाहतूक पूल'
                : language === 'hi'
                  ? 'ग्रामीण माल ढुलाई पूल'
                  : 'Rural Freight Pooling'}
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
                  : language === 'hi'
                    ? `बुकिंग कन्फर्म! ₹${latestBooking.totalFare} में`
                    : `Space Confirmed for ₹${latestBooking.totalFare}`}
              </Text>
              <Text style={styles.bookingBannerSub}>
                {language === 'mr'
                  ? `टेम्पोपेक्षा तुमची ₹${latestBooking.estimatedSavings} बचत झाली! संकलन: ${latestBooking.pickupHub}`
                  : `You saved ₹${latestBooking.estimatedSavings}! Pickup at: ${latestBooking.pickupHub}`}
              </Text>
            </View>
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

        {/* Route Filter Chips (Smooth horizontal scrollable single line) */}
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

            <Pressable
              style={[styles.filterChip, activeFilter === 'vashi' && styles.filterChipActive]}
              onPress={() => setActiveFilter('vashi')}>
              <Text style={[styles.filterText, activeFilter === 'vashi' && styles.filterTextActive]}>
                {language === 'mr' ? 'वाशी मुंबई' : 'Vashi Mumbai'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'sangli' && styles.filterChipActive]}
              onPress={() => setActiveFilter('sangli')}>
              <Text style={[styles.filterText, activeFilter === 'sangli' && styles.filterTextActive]}>
                {language === 'mr' ? 'सांगली मार्केट' : 'Sangli Market'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Rides List */}
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransportCard
              ride={item}
              onBookPress={(r) => setSelectedRideForBooking(r)}
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
    paddingBottom: 10,
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
  bookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#34A853',
    marginHorizontal: 18,
    marginBottom: 10,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  bookingBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyIcon: {
    fontSize: 16,
  },
  bookingBannerText: {
    flex: 1,
  },
  bookingBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#137333',
  },
  bookingBannerSub: {
    fontSize: 11,
    color: '#137333',
    marginTop: 2,
  },
  dismissBtn: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 18,
    marginBottom: 10,
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
    marginBottom: 10,
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
    paddingHorizontal: 14,
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
});
