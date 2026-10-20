import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { createMarketplaceOrder } from '@/lib/marketplace-store';
import type { MarketplaceOrder, MarketplaceProduct } from '@/types/marketplace';
import type { Profile } from '@/types/profile';

type BuyProductModalProps = {
  product: MarketplaceProduct | null;
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onOrderSuccess: (order: MarketplaceOrder) => void;
};

export function BuyProductModal({
  product,
  visible,
  onClose,
  profile,
  onOrderSuccess,
}: BuyProductModalProps) {
  const { language } = useI18n();

  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState(profile?.location.label || '');
  const [buyerPhone, setBuyerPhone] = useState(profile?.phone || '');
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const totalPrice = quantity * product.price;

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      const order: MarketplaceOrder = {
        id: `order-${Date.now()}`,
        productId: product.id,
        productTitle: product.title,
        quantity,
        unit: product.unit,
        unitPrice: product.price,
        totalPrice,
        buyerName: profile?.name || 'ग्राहक (Buyer)',
        buyerPhone: buyerPhone || '+91 98000 00000',
        deliveryAddress: deliveryAddress || 'स्थानिक वितरण / शेतातून संकलन',
        status: 'confirmed',
        orderedAt: new Date().toISOString(),
      };

      await createMarketplaceOrder(order);
      onOrderSuccess(order);
      onClose();
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {language === 'mr' ? 'खरेदी निश्चित करा' : 'Confirm Purchase'}
              </Text>
              <Text style={styles.sub}>{product.title}</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <AppIcon name={Icons.close} size={15} color={Brand.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Quantity Selector */}
            <View style={styles.qtySection}>
              <Text style={styles.sectionLabel}>
                {language === 'mr' ? 'प्रमाण निवडा (Quantity):' : 'Select Quantity:'}
              </Text>

              <View style={styles.counterRow}>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>

                <View style={styles.qtyValueBox}>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <Text style={styles.qtyUnit}>{product.unit}</Text>
                </View>

                <Pressable
                  style={styles.counterBtn}
                  onPress={() => setQuantity((q) => Math.min(product.quantityAvailable, q + 1))}>
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Delivery / Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'mr' ? 'वितरण पत्ता / गाव (Delivery Address):' : 'Delivery Address:'}
              </Text>
              <TextInput
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder={language === 'mr' ? 'तुमचे गाव किंवा पत्ता टाका' : 'Enter village or address'}
                placeholderTextColor={Brand.inkFaint}
                style={styles.input}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'mr' ? 'संपर्क क्रमांक (Phone Number):' : 'Phone Number:'}
              </Text>
              <TextInput
                value={buyerPhone}
                onChangeText={setBuyerPhone}
                keyboardType="phone-pad"
                placeholder="+91"
                placeholderTextColor={Brand.inkFaint}
                style={styles.input}
              />
            </View>

            {/* Summary Price Box */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {language === 'mr' ? 'दर (Unit Rate)' : 'Unit Rate'}
                </Text>
                <Text style={styles.summaryVal}>
                  ₹{product.price} / {product.unit}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {language === 'mr' ? 'एकूण प्रमाण' : 'Quantity'}
                </Text>
                <Text style={styles.summaryVal}>
                  {quantity} {product.unit}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>
                  {language === 'mr' ? 'एकूण देय रक्कम' : 'Total Amount'}
                </Text>
                <Text style={styles.totalVal}>₹{totalPrice}</Text>
              </View>
            </View>

            {/* Confirm Button */}
            <Pressable
              style={styles.confirmBtn}
              onPress={handleConfirmOrder}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Confirm and place order">
              {submitting ? (
                <ActivityIndicator size="small" color={Brand.surface} />
              ) : (
                <>
                  <AppIcon name={Icons.check} size={16} color={Brand.surface} />
                  <Text style={styles.confirmBtnText}>
                    {language === 'mr'
                      ? `₹${totalPrice} मध्ये खरेदी निश्चित करा`
                      : `Confirm Order for ₹${totalPrice}`}
                  </Text>
                </>
              )}
            </Pressable>
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
  sheet: {
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 19, 31, 0.08)',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.ink,
  },
  sub: {
    fontSize: 12,
    color: Brand.inkMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  qtySection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.ink,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.1)',
  },
  counterBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.ink,
    lineHeight: 24,
  },
  qtyValueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  qtyValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Brand.ink,
  },
  qtyUnit: {
    fontSize: 12,
    color: Brand.inkMuted,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.inkMuted,
    textTransform: 'uppercase',
  },
  input: {
    height: 44,
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Brand.ink,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  summaryCard: {
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Brand.inkMuted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(22, 19, 31, 0.08)',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.ink,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F9D58',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.ink,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.surface,
  },
});
