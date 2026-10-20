import { Icons, type AppIconName } from '@/components/app-icon';
import type { TranslationKey } from '@/i18n';
import type { UserRole } from '@/types/profile';

/**
 * Role-aware workspace content.
 *
 * Features live in three buckets:
 *  - shared features are visible to every role,
 *  - role features are only returned for the matching role,
 *  - nothing is shown twice.
 *
 * To add a real feature later, append it to the right list and give it an
 * action. The home screen only renders what `getRoleWorkspaceFeatures`
 * returns, so one persona can never see another persona's section.
 */
export type WorkspaceFeature = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: AppIconName;
};

export type SharedFeatureAction = 'search' | 'notifications' | 'activity';

export type SharedWorkspaceFeature = WorkspaceFeature & {
  action: SharedFeatureAction;
};

export const ROLE_LABEL_KEYS: Record<UserRole, TranslationKey> = {
  consumer: 'accountType.consumer',
  farmer: 'role.farmer',
  kirana: 'role.kirana',
  entrepreneur: 'role.entrepreneur',
};

export const SHARED_WORKSPACE_FEATURES: SharedWorkspaceFeature[] = [
  {
    id: 'search',
    action: 'search',
    icon: Icons.search,
    titleKey: 'workspace.searchTitle',
    descriptionKey: 'workspace.searchDesc',
  },
  {
    id: 'notifications',
    action: 'notifications',
    icon: Icons.bell,
    titleKey: 'workspace.notificationsTitle',
    descriptionKey: 'workspace.notificationsDesc',
  },
  {
    id: 'activity',
    action: 'activity',
    icon: Icons.chart,
    titleKey: 'workspace.activityTitle',
    descriptionKey: 'workspace.activityDesc',
  },
];

export const ROLE_WORKSPACE_FEATURES: Record<UserRole, WorkspaceFeature[]> = {
  consumer: [
    {
      id: 'consumer-explore',
      icon: Icons.search,
      titleKey: 'workspace.consumerExploreTitle',
      descriptionKey: 'workspace.consumerExploreDesc',
    },
    {
      id: 'consumer-services',
      icon: Icons.grid,
      titleKey: 'workspace.consumerServicesTitle',
      descriptionKey: 'workspace.consumerServicesDesc',
    },
    {
      id: 'consumer-orders',
      icon: Icons.sparkle,
      titleKey: 'workspace.consumerOrdersTitle',
      descriptionKey: 'workspace.consumerOrdersDesc',
    },
  ],
  farmer: [
    {
      id: 'mandi-prices',
      icon: Icons.chart,
      titleKey: 'workspace.farmerMandiTitle',
      descriptionKey: 'workspace.farmerMandiDesc',
    },
    {
      id: 'crop-advisory',
      icon: Icons.sparkle,
      titleKey: 'workspace.farmerAdvisoryTitle',
      descriptionKey: 'workspace.farmerAdvisoryDesc',
    },
    {
      id: 'weather',
      icon: Icons.sun,
      titleKey: 'workspace.farmerWeatherTitle',
      descriptionKey: 'workspace.farmerWeatherDesc',
    },
  ],
  kirana: [
    {
      id: 'stock-suppliers',
      icon: Icons.grid,
      titleKey: 'workspace.kiranaStockTitle',
      descriptionKey: 'workspace.kiranaStockDesc',
    },
    {
      id: 'daily-ledger',
      icon: Icons.chart,
      titleKey: 'workspace.kiranaLedgerTitle',
      descriptionKey: 'workspace.kiranaLedgerDesc',
    },
    {
      id: 'billing',
      icon: Icons.check,
      titleKey: 'workspace.kiranaBillingTitle',
      descriptionKey: 'workspace.kiranaBillingDesc',
    },
  ],
  entrepreneur: [
    {
      id: 'payments',
      icon: Icons.wallet,
      titleKey: 'workspace.entrepreneurPaymentsTitle',
      descriptionKey: 'workspace.entrepreneurPaymentsDesc',
    },
    {
      id: 'customers',
      icon: Icons.person,
      titleKey: 'workspace.entrepreneurCustomersTitle',
      descriptionKey: 'workspace.entrepreneurCustomersDesc',
    },
    {
      id: 'growth',
      icon: Icons.chart,
      titleKey: 'workspace.entrepreneurGrowthTitle',
      descriptionKey: 'workspace.entrepreneurGrowthDesc',
    },
  ],
};

/** Only the selected role's tools are returned, which is what hides the rest. */
export function getRoleWorkspaceFeatures(role: UserRole): WorkspaceFeature[] {
  return ROLE_WORKSPACE_FEATURES[role] ?? [];
}
