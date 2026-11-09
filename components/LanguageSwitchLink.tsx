import { useTranslation } from 'react-i18next';
import { LOCALES } from '@/src/i18n';

const LanguageSwitchLink: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <select
      className="border-[1px] border-gray-300 px-[2px]"
      value={i18n.resolvedLanguage}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
    >
      {LOCALES.map((locale) => (
        <option style={{ fontSize: 'small' }} key={locale} value={locale}>
          {locale}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitchLink;
