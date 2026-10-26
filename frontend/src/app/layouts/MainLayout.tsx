import React from 'react';
import { Navbar } from '@/features/navigation';
import { AuthDialog } from '@/features/auth';
import './styles/mainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="layout-container">
      <Navbar />
      {children}
      <AuthDialog />
    </div>
  );
}

export default MainLayout;
