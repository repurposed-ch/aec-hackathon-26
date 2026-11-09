import React, { ReactNode } from 'react';
import { Link } from 'react-router';

/** App-internal paths are given relative ('favorites') or absolute ('/'); both resolve from the app root. */
export const toAppPath = (href: string) => (href.startsWith('/') ? href : '/' + href);

const LinkComponent: React.FC<{
  children: ReactNode;
  tooltip?: string;
  href: string;
  className?: string;
}> = ({ href, className, ...props }) => (
  <Link className={(className ?? '') + ' cursor-pointer'} to={toAppPath(href)} {...props} />
);

export default LinkComponent;
