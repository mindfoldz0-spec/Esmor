import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import type { MarketplaceProduct } from '@/types/marketplace';

type ProductCardProps = {
  product: MarketplaceProduct;
  onBuyPress: (product: MarketplaceProduct) => void;
};

const CATEGORY_LABELS: Record<string, { mr: string; hi: string; en: string }> = {
  vegetables: { mr: 'भाजीपाला', hi: 'सब्जियां', en: 'Vegetables' },
  fruits: { mr: 'फळे', hi: 'फल', en: 'Fruits' },
  grains: { mr: 'धान्य', hi: 'अनाज', en: 'Grains' },
  dairy: { mr: 'दुग्ध व गूळ', hi: 'डेयरी व गुड़', en: 'Dairy' },
  equipment: { mr: 'शेती साहित्य', hi: 'कृषि उपकरण', en: 'Equipment' },
  kirana: { mr: 'किराणा', hi: 'किराना', en: 'Kirana' },
  handcrafts: { mr: 'हस्तकला', hi: 'हस्तशिल्प', en: 'Handcrafts' },
};

export function ProductCard({ product, onBuyPress }: ProductCardProps) {
  const { language } = useI18n();

  const handleCallSeller = () => {
    const cleanPhone = product.sellerPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const catLabel =
    CATEGORY_LABELS[product.category]?.[language as 'mr' | 'hi' | 'en'] ||
    product.category;

  return (
    <View style={styles.card}>
      {/* Product Image & Badges */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{catLabel}</Text>
        </View>
        {product.isOrganic && (
          <View style={styles.organicBadge}>
            <Text style={styles.organicText}>🌱 {language === 'mr' ? 'सेंद्रिय' : 'Organic'}</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.unit}>/{product.unit}</Text>
          <View style={styles.stockPill}>
            <Text style={styles.stockText}>
              {language === 'mr' ? 'साठा:' : 'Stock:'} {product.quantityAvailable} {product.unit}
            </Text>
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerRow}>
          <AppIcon name={Icons.location} size={12} color={Brand.inkMuted} />
          <Text style={styles.sellerText} numberOfLines={1}>
            {product.sellerName} • {product.sellerVillage}
          </Text>
        </View>

        {/* Actions: Call & Buy */}
        <View style={styles.actions}>
          <Pressable
            style={styles.callBtn}
            onPress={handleCallSeller}
            accessibilityRole="button"
            accessibilityLabel="Call seller">
            <AppIcon name={Icons.phone} size={14} color={Brand.ink} />
            <Text style={styles.callText}>
              {language === 'mr' ? 'कॉल' : 'Call'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.buyBtn}
            onPress={() => onBuyPress(product)}
            accessibilityRole="button"
            accessibilityLabel="Buy this product">
            <AppIcon name={Icons.check} size={14} color={Brand.surface} />
            <Text style={styles.buyText}>
              {language === 'mr' ? 'खरेदी करा' : 'Buy Now'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
    shadowColor: '#16131F',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrap: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: Brand.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(22, 19, 31, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  organicBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  organicText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#03543F',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.ink,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F9D58',
  },
  unit: {
    fontSize: 12,
    color: Brand.inkMuted,
    fontWeight: '600',
  },
  stockPill: {
    backgroundColor: Brand.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  stockText: {
    fontSize: 10,
    color: Brand.inkMuted,
    fontWeight: '600',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  sellerText: {
    fontSize: 11,
    color: Brand.inkMuted,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.1)',
    gap: 4,
  },
  callText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
  },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.ink,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  buyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.surface,
  },
});
