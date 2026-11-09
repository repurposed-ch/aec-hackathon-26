import { useTranslation } from 'react-i18next';
import LanguageSwitchLink from './LanguageSwitchLink';

export const Footer = () => {
  const { t } = useTranslation('footer');

  return (
    <footer className="flex flex-row justify-between items-cente gap-2">
      <p>{t('change-locale')}: </p>
      <p>
        <LanguageSwitchLink />
      </p>
    </footer>
  );
};
