import logo from '/assets/icons/repurposed.svg';
import { useTranslation } from 'react-i18next';
import LanguageSwitchLink from './LanguageSwitchLink';
import Link from './Link';
import { PlaceholderIcon } from './iconography/PlaceholderIcon';

export const Navigation: React.FC<{
  links: { href: string; text: string; icon?: React.ReactNode }[];
  withoutTopMargin?: boolean;
}> = ({ links, withoutTopMargin = false }) => {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="fixed top-0 w-[100vw] z-10000 bg-background">
        <div className="w-full max-w-[var(--default-max-width)] px-[var(--card_grid_left_right_padding)] mx-auto left-0 p-2 flex flex-row items-center justify-between">
          <Link href="/">
            <img src={logo.src} alt="logo" className="h-12" />
          </Link>
          <span className="text-sm flex flex-row items-center gap-2">
            {links.map((link) => (
              <Link
                href={link.href}
                children={link.icon ? link.icon : t(link.text)}
                tooltip={link.icon ? t(link.text) : undefined}
                key={link.href}
              />
            ))}
            <LanguageSwitchLink />
          </span>
        </div>
      </div>
      {withoutTopMargin ? null : <span className="h-18" />}
    </>
  );
};
