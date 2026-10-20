import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, Icons } from '@/components/app-icon';
import type { SearchItem } from '@/constants/search';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';

type SearchMenuProps = {
  visible: boolean;
  onClose: () => void;
  /** Defaults to the localized demo recents. */
  recentSearches?: readonly string[];
  /** Defaults to the localized demo content. */
  items?: readonly SearchItem[];
  onSelectItem?: (item: SearchItem) => void;
};

/**
 * Top-sheet search experience.
 *
 * It is intentionally data-driven: pass `items` from your real content and the
 * filtering, empty state and result rows keep working unchanged.
 */
export function SearchMenu({
  visible,
  onClose,
  recentSearches,
  items,
  onSelectItem,
}: SearchMenuProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');

  const defaultRecentSearches = useMemo(
    () => [
      t('search.recent.yoga'),
      t('search.recent.tiffany'),
      t('search.recent.balance'),
    ],
    [t]
  );

  const defaultItems = useMemo<SearchItem[]>(
    () => [
      {
        id: 'yoga-group',
        title: t('search.item.yogaGroup'),
        subtitle: t('search.item.yogaGroupSubtitle'),
        category: t('search.category.class'),
      },
      {
        id: 'balance',
        title: t('search.item.balance'),
        subtitle: t('search.item.balanceSubtitle'),
        category: t('search.category.class'),
      },
      {
        id: 'tiffany-wau',
        title: t('search.item.tiffany'),
        subtitle: t('search.item.tiffanySubtitle'),
        category: t('search.category.people'),
      },
      {
        id: 'daily-challenge',
        title: t('search.item.daily'),
        subtitle: t('search.item.dailySubtitle'),
        category: t('search.category.challenge'),
      },
    ],
    [t]
  );

  const localizedItems = items ?? defaultItems;
  const [recents, setRecents] = useState<string[]>(() => [
    ...(recentSearches ?? defaultRecentSearches),
  ]);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return localizedItems.filter((item) =>
      `${item.title} ${item.subtitle} ${item.category}`.toLowerCase().includes(normalizedQuery)
    );
  }, [localizedItems, normalizedQuery]);

  const setFocusedQuery = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      return;
    }

    setQuery(trimmed);
    setRecents((previous) => {
      const withoutDuplicate = previous.filter(
        (entry) => entry.toLowerCase() !== trimmed.toLowerCase()
      );
      return [trimmed, ...withoutDuplicate].slice(0, 6);
    });
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const selectItem = (item: SearchItem) => {
    onSelectItem?.(item);
    handleClose();
  };

  const handleShow = () => {
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
      onShow={handleShow}>
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('search.close')}
        />

        <View style={[styles.panel, { paddingTop: insets.top + 10 }]}>
          <View style={styles.searchRow}>
            <View style={styles.inputShell}>
              <AppIcon name={Icons.search} size={18} color={Brand.inkMuted} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => setFocusedQuery(query)}
                placeholder={t('search.placeholder')}
                placeholderTextColor={Brand.inkFaint}
                selectionColor={Brand.accent}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                style={styles.input}
                accessibilityLabel={t('search.placeholder')}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('search.clearField')}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                  <AppIcon name={Icons.close} size={15} color={Brand.inkMuted} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('search.cancel')}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.cancel}>{t('search.cancel')}</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scroll}>
            {normalizedQuery ? (
              results.length > 0 ? (
                <View>
                  <Text style={styles.sectionTitle}>{t('search.results')}</Text>
                  <View style={styles.resultsCard}>
                    {results.map((item, index) => (
                      <Pressable
                        key={item.id}
                        onPress={() => selectItem(item)}
                        accessibilityRole="button"
                        accessibilityLabel={t('search.itemA11y', {
                          title: item.title,
                          category: item.category,
                        })}
                        style={({ pressed }) => [
                          styles.resultRow,
                          index > 0 && styles.resultDivider,
                          pressed && styles.rowPressed,
                        ]}>
                        <View style={styles.resultIcon}>
                          <Text style={styles.resultIconText}>
                            {item.title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.resultBody}>
                          <Text style={styles.resultTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.resultSubtitle} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <AppIcon name={Icons.search} size={24} color={Brand.inkMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {t('search.noResults', { query: query.trim() })}
                  </Text>
                  <Text style={styles.emptyText}>{t('search.noResultsHint')}</Text>
                </View>
              )
            ) : (
              <>
                {recents.length > 0 ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{t('search.recent')}</Text>
                      <Pressable
                        onPress={() => setRecents([])}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={t('search.clearRecent')}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <Text style={styles.clearAll}>{t('search.clear')}</Text>
                      </Pressable>
                    </View>

                    <View style={styles.chips}>
                      {recents.map((term) => (
                        <Pressable
                          key={term}
                          onPress={() => setFocusedQuery(term)}
                          accessibilityRole="button"
                          accessibilityLabel={t('search.searchFor', { term })}
                          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                          <AppIcon name={Icons.clock} size={14} color={Brand.inkMuted} />
                          <Text style={styles.chipText}>{term}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {localizedItems.length > 0 ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{t('search.suggestions')}</Text>
                      <AppIcon name={Icons.sparkle} size={16} color={Brand.accentInk} />
                    </View>

                    <View style={styles.resultsCard}>
                      {localizedItems.slice(0, 4).map((item, index) => (
                        <Pressable
                          key={item.id}
                          onPress={() => selectItem(item)}
                          accessibilityRole="button"
                          accessibilityLabel={t('search.itemA11y', {
                            title: item.title,
                            category: item.category,
                          })}
                          style={({ pressed }) => [
                            styles.resultRow,
                            index > 0 && styles.resultDivider,
                            pressed && styles.rowPressed,
                          ]}>
                          <View style={styles.resultIcon}>
                            <Text style={styles.resultIconText}>
                              {item.title.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.resultBody}>
                            <Text style={styles.resultTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.resultSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          </View>
                          <AppIcon
                            name={Icons.chevronRight}
                            size={16}
                            color={Brand.inkFaint}
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {recents.length === 0 && localizedItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <AppIcon name={Icons.search} size={24} color={Brand.inkMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('search.emptyTitle')}</Text>
                    <Text style={styles.emptyText}>{t('search.emptyText')}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: Brand.backdrop,
  },
  panel: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: Brand.searchPanel,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 22,
    shadowColor: '#140E24',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputShell: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: Brand.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    gap: 9,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'solid' as const, outlineWidth: 0 } }),
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 19, 31, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    marginTop: 18,
    maxHeight: 440,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  clearAll: {
    color: Brand.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.divider,
  },
  chipPressed: {
    backgroundColor: Brand.surfaceTint,
  },
  chipText: {
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsCard: {
    backgroundColor: Brand.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.divider,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  rowPressed: {
    backgroundColor: Brand.surfaceTint,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  resultBody: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Brand.accentSoft,
  },
  categoryText: {
    color: Brand.accentInk,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  pressed: {
    opacity: 0.6,
  },
});
