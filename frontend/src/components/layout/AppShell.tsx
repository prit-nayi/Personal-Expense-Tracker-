import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TransactionModal } from '../../features/transactions/TransactionModal';

export const AppShell: React.FC = () => {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const handleOpenTransactionModal = () => {
    setIsTransactionModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 lg:pb-0">
        <Outlet context={{ openTransactionModal: handleOpenTransactionModal }} />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onAddTransaction={handleOpenTransactionModal} />

      {/* Global Add Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </div>
  );
};
