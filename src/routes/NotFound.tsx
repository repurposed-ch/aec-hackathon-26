import { useTranslation } from 'react-i18next';

import Link from '../../components/Link';
import { Navigation } from '@/components/Navigation';
import { SVGIcon } from '@/components/SVGIcon';

import heart from '/assets/icons/heart.svg';
import cart from '/assets/icons/shopping_cart.svg';
import home from '/assets/icons/home.svg';
import logo from '/assets/icons/repurposed.svg';

const Homepage = () => {
  const { t } = useTranslation(['404', 'footer']);

  return (
    <>
      <main>
        <Navigation
          links={[
            { href: 'favorites', text: 'to-favorites', icon: <SVGIcon src={heart} /> },
            { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart} /> },
            { href: '/', text: 'back-to-home', icon: <SVGIcon src={home} /> }
          ]}
          withoutTopMargin
        />
        <div className="max-w-standard-div standard-padding flex lg:flex-row lg:justify-center flex-col items-center justify-center gap-x-8 gap-y-2 p-4">
          <img
            src={logo}
            alt="logo"
            className="w-[min(min(30svh,80svw),300px)] min-w-[min(min(30svh,80svw),200px)]"
          />
          <p className={'lg:text-left text-[1.5rem] sm:text-[3rem] text-repurposed max-w-[90svw] w-[690px] '}>
            {t('h1')}
          </p>
        </div>
        <div>
          <Link href="/">
            <button type="button">{t('common:back-to-home')}</button>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Homepage;
