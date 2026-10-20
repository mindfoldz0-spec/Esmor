import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { TransportCard } from '@/components/transport/transport-card';
import { BookRideModal } from '@/components/transport/book-ride-modal';
import { PostRideModal } from '@/components/transport/post-ride-modal';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { speakPrompt } from '@/lib/voice-player';
import { getAllTransportRides, INITIAL_MAHARASHTRA_RIDES } from '@/lib/transport-store';
import type { TransportRide, TransportBooking } from '@/types/transport';

type FilterTab = 'all' | 'pune' | 'nashik' | 'vashi';

export default function ExploreScreen() {
  const { language } = useI18n();
  const [rides, setRides] = useState<TransportRide[]>(INITIAL_MAHARASHTRA_RIDES);
  const [refreshing, setRefreshing] = useState(false);
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
    if (activeFilter === 'pune') {
      return ride.toMarket.toLowerCase().includes('पुणे') || ride.toMarket.toLowerCase().includes('pune');
    }
    if (activeFilter === 'nashik') {
      return ride.toMarket.toLowerCase().includes('नाशिक') || ride.toMarket.toLowerCase().includes('nashik');
    }
    if (activeFilter === 'vashi') {
      return ride.toMarket.toLowerCase().includes('वाशी') || ride.toMarket.toLowerCase().includes('vashi');
    }
    return true;
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
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

        {/* Route Filter Chips */}
        <View style={styles.filterRow}>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🚚</Text>
              <Text style={styles.emptyTitle}>
                {language === 'mr' ? 'या मार्गावर सध्या गाड्या उपलब्ध नाहीत' : 'No trips found for this route'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'mr'
                  ? 'तुमची स्वतःची गाडी नोंदवून इतरांना सोबत घेऊन उत्पन्न मिळवा.'
                  : 'Be the first to list your vehicle and earn extra freight income.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>

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
  safeArea: {
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
    paddingTop: 12,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 8,
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
    paddingTop: 8,
    paddingBottom: 96,
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
