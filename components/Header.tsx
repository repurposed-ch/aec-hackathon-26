import { useEffect } from 'react';
import logo from '/assets/icons/repurposed.svg';
import { useTranslation } from 'react-i18next';

export const Header: React.FC<{ heading: string; title: string; className?: string }> = ({
  heading,
  title,
  className
}) => {
  const { t } = useTranslation('common');

  useEffect(() => {
    document.title = t(title);
  }, [t, title]);

  return (
    <>
      <div className="max-w-standard-div standard-padding flex lg:flex-row lg:justify-center flex-col items-center justify-center gap-x-8 gap-y-2 p-4">
        <div>
          <img
            src={logo}
            alt="logo"
            className="w-[min(min(30svh,80svw),300px)] min-w-[min(min(30svh,80svw),200px)]"
          />
        </div>
        <p
          className={className + ' lg:text-left text-[1.5rem] sm:text-[3rem] text-repurposed max-w-[90svw] w-[690px] '}
        >
          {t(heading)}
        </p>
      </div>
    </>
  );
};
