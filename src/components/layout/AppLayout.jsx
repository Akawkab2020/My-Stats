import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastProvider } from '../ui/Toast';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div
          className="flex-1 flex flex-col transition-all duration-300"
          style={{ marginRight: collapsed ? '72px' : '260px' }}
          dir="rtl"
        >
          <Navbar collapsed={collapsed} />
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppLayout;
