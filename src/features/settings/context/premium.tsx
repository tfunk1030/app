import * as React from 'react';
import { createContext, useState } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
}


const PremiumContext = createContext<PremiumContextType>({
  isPremium: __DEV__, // Premium enabled in dev mode
  showUpgradeModal: false,
  setShowUpgradeModal: () => {}
});

export function PremiumProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPremium] = useState(__DEV__); // Initialize with dev mode status

  const value = React.useMemo(() => ({
    isPremium,
    showUpgradeModal,
    setShowUpgradeModal
  }), [isPremium, showUpgradeModal, setShowUpgradeModal]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => {
  const context = React.useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};
