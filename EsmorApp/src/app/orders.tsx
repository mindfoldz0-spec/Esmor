import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';
import { formatTimeOfDay, formatTodayDate } from '@/lib/date';
import { getAllMarketplaceOrders } from '@/lib/marketplace-store';
import { getUserBookings } from '@/lib/transport-store';
import type { MarketplaceOrder } from '@/types/marketplace';
import type { TransportBooking } from '@/types/transport';

const CARGO_CATEGORY_KEYS: Partial<Record<TransportBooking['cargoCategory'], TranslationKey>> = {
  vegetables: 'category.vegetables',
  fruits: 'category.fruits',
  grains: 'category.grains',
  kirana: 'category.kirana',
  handcrafts: 'category.handcrafts',
};

function orderStatusKey(status: MarketplaceOrder['status']): TranslationKey {
  switch (status) {
    case 'dispatched':
      return 'orders.statusDispatched';
    case 'delivered':
      return 'orders.statusDelivered';
    default:
      return 'orders.statusConfirmed';
  }
}

function bookingStatusKey(status: TransportBooking['status']): TranslationKey {
  switch (status) {
    case 'in_transit':
      return 'orders.statusInTransit';
    case 'delivered':
      return 'orders.statusDelivered';
    default:
      return 'orders.statusConfirmed';
  }
}

function formatEntryDate(language: 'en' | 'hi' | 'mr', iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${formatTodayDate(language, date)} · ${formatTimeOfDay(date)}`;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { t, language } = useI18n();

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [nextOrders, nextBookings] = await Promise.all([
      getAllMarketplaceOrders(),
      getUserBookings(),
    ]);
    setOrders(nextOrders);
    setBookings(nextBookings);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        await load();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  const totalSpent =
    orders.reduce((sum, order) => sum + order.totalPrice, 0) +
    bookings.reduce((sum, booking) => sum + booking.totalFare, 0);
  const totalSavings = bookings.reduce((sum, booking) => sum + booking.estimatedSavings, 0);
  const isEmpty = orders.length === 0 && bookings.length === 0;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
              style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}>
              <AppIcon name={Icons.chevronLeft} size={20} color={Brand.ink} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>{t('orders.eyebrow')}</Text>
              <Text style={styles.title}>{t('orders.title')}</Text>
            </View>
          </View>

          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <AppIcon name={Icons.wallet} size={20} color={Brand.ink} />
            </View>
            <View style={styles.summaryBody}>
              <Text style={styles.summaryLabel}>{t('orders.summarySpent')}</Text>
              <Text style={styles.summaryValue}>₹{totalSpent}</Text>
            </View>
            {totalSavings > 0 ? (
              <View style={styles.savingsPill}>
                <Text style={styles.savingsPillText}>
                  {t('orders.savings', { savings: totalSavings })}
                </Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Brand.accentInk} />
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <AppIcon name={Icons.wallet} size={26} color={Brand.inkMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('orders.emptySubtitle')}</Text>
            </View>
          ) : (
            <>
              {/* Marketplace orders */}
              {orders.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>{t('orders.marketplaceSection')}</Text>
                  <View style={styles.listCard}>
                    {orders.map((order, index) => (
                      <View
                        key={order.id}
                        style={[styles.row, index > 0 && styles.rowDivider]}>
                        <View style={styles.rowIcon}>
                          <AppIcon name={Icons.check} size={16} color={Brand.ink} />
                        </View>
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {order.productTitle}
                          </Text>
                          <Text style={styles.rowSub} numberOfLines={1}>
                            {t(orderStatusKey(order.status))}
                            {'  ·  '}
                            {order.quantity} {order.unit}
                            {'  ·  '}
                            {formatEntryDate(language, order.orderedAt)}
                          </Text>
                        </View>
                        <Text style={styles.rowValue}>₹{order.totalPrice}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {/* Transport bookings */}
              {bookings.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>{t('orders.transportSection')}</Text>
                  <View style={styles.listCard}>
                    {bookings.map((booking, index) => {
                      const cargoKey = CARGO_CATEGORY_KEYS[booking.cargoCategory];
                      const cargoLabel = cargoKey ? t(cargoKey) : booking.cargoCategory;

                      return (
                        <View
                          key={booking.id}
                          style={[styles.row, index > 0 && styles.rowDivider]}>
                          <View style={[styles.rowIcon, styles.rowIconTransport]}>
                            <Text style={styles.rowEmoji}>🚚</Text>
                          </View>
                          <View style={styles.rowBody}>
                            <Text style={styles.rowTitle} numberOfLines={1}>
                              {t('orders.bookingRow', {
                                quantity: booking.quantity,
                                unit: booking.unitType,
                                cargo: cargoLabel,
                              })}
                            </Text>
                            <Text style={styles.rowSub} numberOfLines={1}>
                              {t(bookingStatusKey(booking.status))}
                              {'  ·  '}
                              {formatEntryDate(language, booking.bookedAt)}
                            </Text>
                          </View>
                          <View style={styles.rowValueBlock}>
                            <Text style={styles.rowValue}>₹{booking.totalFare}</Text>
                            {booking.estimatedSavings > 0 ? (
                              <Text style={styles.rowSavings}>
                                {t('orders.savings', { savings: booking.estimatedSavings })}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  backPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.95 }],
  },
  eyebrow: {
    color: Brand.accentInk,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: Brand.ink,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: {
    flex: 1,
  },
  summaryLabel: {
    color: Brand.inkMuted,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    color: Brand.ink,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  savingsPill: {
    backgroundColor: Brand.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  savingsPillText: {
    color: Brand.success,
    fontSize: 11,
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: Brand.surface,
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: Brand.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  emptySub: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 4,
    marginLeft: 2,
  },
  listCard: {
    backgroundColor: Brand.surface,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconTransport: {
    backgroundColor: '#DEF7EC',
  },
  rowEmoji: {
    fontSize: 16,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: Brand.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  rowSub: {
    color: Brand.inkMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  rowValueBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowValue: {
    color: Brand.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  rowSavings: {
    color: Brand.success,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
});
