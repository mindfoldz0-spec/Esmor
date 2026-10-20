import { Icons } from '@/components/app-icon';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useI18n } from '@/i18n';

export default function ActivityScreen() {
  const { t } = useI18n();

  return (
    <PlaceholderScreen
      eyebrow={t('activity.eyebrow')}
      title={t('activity.title')}
      icon={Icons.chart}
      heading={t('activity.heading')}
      description={t('activity.description')}
    />
  );
}
