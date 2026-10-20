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
import { ProductCard } from '@/components/marketplace/product-card';
import { AgenticListingModal } from '@/components/marketplace/agentic-listing-modal';
import { BuyProductModal } from '@/components/marketplace/buy-product-modal';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { speakPrompt } from '@/lib/voice-player';
import {
  getAllMarketplaceProducts,
  INITIAL_MARKETPLACE_PRODUCTS,
} from '@/lib/marketplace-store';
import type {
  MarketplaceOrder,
  MarketplaceProduct,
  ProductCategory,
} from '@/types/marketplace';

type CategoryFilter = 'all' | ProductCategory;

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useI18n();
  const { profile } = useAppData();

  // Producer check: small listing icon is ONLY visible to producers!
  const isProducer =
    profile?.category === 'producer' ||
    profile?.role === 'farmer' ||
    profile?.role === 'kirana' ||
    profile?.role === 'entrepreneur';

  const [products, setProducts] = useState<MarketplaceProduct[]>(INITIAL_MARKETPLACE_PRODUCTS);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<MarketplaceProduct | null>(null);
  const [latestOrder, setLatestOrder] = useState<MarketplaceOrder | null>(null);
  const [speakingHeader, setSpeakingHeader] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAllMarketplaceProducts().then((list) => {
      if (mounted) {
        setProducts(list);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const list = await getAllMarketplaceProducts();
    setProducts(list);
    setRefreshing(false);
  };

  const handleHeaderVoice = async () => {
    try {
      setSpeakingHeader(true);
      const text =
        language === 'mr'
          ? 'ग्रामीण बाजारपेठेत आपले स्वागत आहे. येथे शेतकरी आणि कारागीर थेट ताजे उत्पादन विकतात. ग्राहक थेट वाजवी दरात खरेदी करू शकतात.'
          : language === 'hi'
            ? 'ग्रामीण बाजार में आपका स्वागत है। यहां किसान सीधे अपने उत्पाद बेचते हैं और उपभोक्ता खरीद सकते हैं।'
            : 'Welcome to the Rural Marketplace. Farmers and artisans sell directly to consumers at fair prices.';

      await speakPrompt('marketplace_header', language, text);
    } finally {
      setSpeakingHeader(false);
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (activeCategory !== 'all' && prod.category !== activeCategory) {
      return false;
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      const matchesTitle = prod.title.toLowerCase().includes(q);
      const matchesSeller = prod.sellerName.toLowerCase().includes(q);
      const matchesVillage = prod.sellerVillage.toLowerCase().includes(q);
      const matchesDesc = prod.description.toLowerCase().includes(q);
      if (!matchesTitle && !matchesSeller && !matchesVillage && !matchesDesc) {
        return false;
      }
    }

    return true;
  });

  return (
    <View style={styles.screen}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.eyebrow}>
              {language === 'mr'
                ? 'थेट शेतकरी व स्थानिक बाजार'
                : language === 'hi'
                  ? 'सीधे किसान व स्थानीय बाजार'
                  : 'Direct Farm Marketplace'}
            </Text>
            <Text style={styles.title}>
              {language === 'mr'
                ? 'ग्रामीण बाजारपेठ'
                : language === 'hi'
                  ? 'ग्रामीण बाजार'
                  : 'Rural Marketplace'}
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

            {/* Agentic Voice Listing Button — EXCLUSIVELY for PRODUCERS */}
            {isProducer && (
              <Pressable
                style={styles.agenticListBtn}
                onPress={() => setListingModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="List new product with AI voice agent">
                <View style={styles.micIconCircle}>
                  <AppIcon name={Icons.mic} size={13} color={Brand.surface} />
                </View>
                <Text style={styles.agenticListBtnText}>
                  {language === 'mr' ? '+ विक्री करा' : language === 'hi' ? '+ बेचें' : '+ Sell'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Latest Order Success Banner */}
        {latestOrder && (
          <View style={styles.orderBanner}>
            <View style={styles.orderBannerIcon}>
              <Text style={styles.partyIcon}>🎉</Text>
            </View>
            <View style={styles.orderBannerText}>
              <Text style={styles.orderBannerTitle}>
                {language === 'mr'
                  ? `खरेदी यशस्वी! ₹${latestOrder.totalPrice}`
                  : `Order Placed! ₹${latestOrder.totalPrice}`}
              </Text>
              <Text style={styles.orderBannerSub}>
                {language === 'mr'
                  ? `${latestOrder.productTitle} (${latestOrder.quantity} ${latestOrder.unit}) नोंदवले गेले आहे.`
                  : `${latestOrder.quantity} ${latestOrder.unit} confirmed.`}
              </Text>
            </View>
            <Pressable onPress={() => setLatestOrder(null)} style={styles.dismissBtn}>
              <AppIcon name={Icons.close} size={14} color={Brand.inkMuted} />
            </Pressable>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <AppIcon name={Icons.search} size={18} color={Brand.inkMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                language === 'mr'
                  ? 'भाजीपाला, फळे, धान्य किंवा शेतकरी शोधा...'
                  : language === 'hi'
                    ? 'सब्जी, फल, अनाज या किसान खोजें...'
                    : 'Search produce, grains, or seller...'
              }
              placeholderTextColor={Brand.inkFaint}
              selectionColor={Brand.accent}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
              accessibilityLabel="Search marketplace products"
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

        {/* Category Horizontal Filter Bar */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}>
            {[
              { id: 'all' as const, mr: 'सर्व (All)', en: 'All' },
              { id: 'vegetables' as const, mr: 'भाजीपाला 🥦', en: 'Vegetables' },
              { id: 'fruits' as const, mr: 'फळे 🥭', en: 'Fruits' },
              { id: 'grains' as const, mr: 'धान्य 🌾', en: 'Grains' },
              { id: 'dairy' as const, mr: 'दूध व गूळ 🥛', en: 'Dairy' },
              { id: 'equipment' as const, mr: 'शेती साहित्य 🚜', en: 'Equipment' },
            ].map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat.id)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    activeCategory === cat.id && styles.categoryChipTextActive,
                  ]}>
                  {language === 'mr' ? cat.mr : cat.en}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Product Cards List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onBuyPress={(prod) => setSelectedProductForBuy(prod)}
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
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyTitle}>
                {language === 'mr'
                  ? 'या प्रकारात सध्या उत्पादने उपलब्ध नाहीत'
                  : 'No products found'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'mr'
                  ? isProducer
                    ? 'वरील "+ विक्री करा" वर टॅप करून तुमचे उत्पादन थेट ग्राहकांना विका.'
                    : 'वेगळा शोध घ्या किंवा नंतर तपासा.'
                  : 'Check back later or search for other items.'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Agentic Conversational Voice Listing Modal (Producers Only) */}
      <AgenticListingModal
        visible={listingModalOpen}
        onClose={() => setListingModalOpen(false)}
        profile={profile}
        onProductCreated={(newProd) => {
          setProducts((prev) => [newProd, ...prev]);
        }}
      />

      {/* Buy Product Modal */}
      <BuyProductModal
        product={selectedProductForBuy}
        visible={selectedProductForBuy !== null}
        onClose={() => setSelectedProductForBuy(null)}
        profile={profile}
        onOrderSuccess={(order) => {
          setLatestOrder(order);
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
  agenticListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  micIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agenticListBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  orderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#31C48D',
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  orderBannerIcon: {
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
  orderBannerText: {
    flex: 1,
  },
  orderBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#03543F',
  },
  orderBannerSub: {
    fontSize: 10,
    color: '#046C4E',
    marginTop: 1,
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
  categorySection: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 18,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: Brand.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.inkMuted,
  },
  categoryChipTextActive: {
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
