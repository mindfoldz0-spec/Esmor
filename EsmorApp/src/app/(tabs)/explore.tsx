import { Icons } from '@/components/app-icon';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useI18n } from '@/i18n';

export default function ExploreScreen() {
  const { t } = useI18n();

  return (
    <PlaceholderScreen
      eyebrow={t('explore.eyebrow')}
      title={t('explore.title')}
      icon={Icons.grid}
      heading={t('explore.heading')}
      description={t('explore.description')}
    />
  );
}
