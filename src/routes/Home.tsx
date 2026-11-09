import React from 'react';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

import { Button } from '@/components/Button';

const Homepage = () => {
  const { t } = useTranslation(['common', 'footer']);

  const groups = [
    {
      label: t('nav-standard'),
      links: [
        { href: '/all-elements', label: t('to-all-elements') },
        { href: '/favorites', label: t('to-favorites') }
      ]
    },
    {
      label: t('nav-tools'),
      links: [
        { href: '/tinder-slides', label: t('to-element-swiping') },
        { href: '/area-composer', label: t('to-area-composer') }
      ]
    },
    {
      label: t('nav-admin'),
      links: [
        { href: '/listings-table', label: t('listings-table') },
        { href: '/add-listing', label: t('add-listing') }
      ]
    }
  ];

  return (
    <div className="bg-repurposed-light h-[100svh] flex flex-col lg:justify-end lg:gap-30 justify-around items-center">
      <Header className="text-black" heading={'h1'} title={'title'} />

      <div className="grid md:grid-cols-[auto_1fr] gap-2 grid-cols-1">
        {groups.map((group) => (
          <React.Fragment key={group.label}>
            <div className="flex items-center justify-end py-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{group.label}</span>
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-2">
              {group.links.map((link) => (
                <Button
                  key={link.href}
                  href={link.href}
                  className="px-2 py-1 text-sm shadow-none border-0 hover:shadow-none"
                >
                  {link.label}
                </Button>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default Homepage;
