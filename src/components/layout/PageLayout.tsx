import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  minimalFooter?: boolean;
  hideFooter?: boolean;
  transparentHeader?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  minimalFooter = false,
  hideFooter = false,
  transparentHeader = false,
  className = 'bg-[#F8F9FA]'
}) => {
  return (
    <div className={`min-h-screen flex flex-col text-[#111827] relative selection:bg-[#E31E24] selection:text-white ${className}`}>
      <Header transparent={transparentHeader} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!hideFooter && <Footer minimal={minimalFooter} />}
    </div>
  );
};
