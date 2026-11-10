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
import { useI18n, type TranslationKey } from '@/i18n';
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

const CATEGORY_FILTERS: { id: CategoryFilter; labelKey: TranslationKey }[] = [
  { id: 'all', labelKey: 'category.all' },
  { id: 'vegetables', labelKey: 'category.vegetables' },
  { id: 'fruits', labelKey: 'category.fruits' },
  { id: 'grains', labelKey: 'category.grains' },
  { id: 'dairy', labelKey: 'category.dairy' },
  { id: 'equipment', labelKey: 'category.equipment' },
];

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { language, t } = useI18n();
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
      const text = t('market.voiceHeader');

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
            <Text style={styles.eyebrow}>{t('market.eyebrow')}</Text>
            <Text style={styles.title}>{t('market.title')}</Text>
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
                <Text style={styles.agenticListBtnText}>{t('market.sell')}</Text>
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
                {t('market.orderBannerTitle', { total: latestOrder.totalPrice })}
              </Text>
              <Text style={styles.orderBannerSub}>
                {t('market.orderBannerSub', {
                  quantity: latestOrder.quantity,
                  unit: latestOrder.unit,
                })}
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
              placeholder={t('market.searchPlaceholder')}
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
            {CATEGORY_FILTERS.map((cat) => (
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
                  {t(cat.labelKey)}
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
              <Text style={styles.emptyTitle}>{t('market.emptyTitle')}</Text>
              <Text style={styles.emptySub}>
                {isProducer ? t('market.emptySubProducer') : t('market.emptySubConsumer')}
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

      {/* Buy Product Modal — keyed by product so the form remounts fresh per product */}
      <BuyProductModal
        key={selectedProductForBuy?.id ?? 'buy'}
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
