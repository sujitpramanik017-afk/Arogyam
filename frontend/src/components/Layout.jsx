import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ArogyaChatbot } from './ArogyaChatbot';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <ArogyaChatbot isFloating={true} initialOpen={false} />
    </div>
  );
};
