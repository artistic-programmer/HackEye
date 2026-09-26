import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  minimalFooter?: boolean;
  hideFooter?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  minimalFooter = false,
  hideFooter = false 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827] relative selection:bg-[#E31E24] selection:text-white">
      <Header />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!hideFooter && <Footer minimal={minimalFooter} />}
    </div>
  );
};
