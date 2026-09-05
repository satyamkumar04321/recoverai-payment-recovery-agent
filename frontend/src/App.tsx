import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { RecoveryQueueView } from './views/RecoveryQueueView';
import { AnalyticsView } from './views/AnalyticsView';
import { SimulatorView } from './views/SimulatorView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import type { Transaction } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleTransactionActionSuccess = (updated: Transaction) => {
    setSelectedTransaction(updated);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-12">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onSelectTransaction={(txn) => setSelectedTransaction(txn)}
            onNavigateToQueue={() => setActiveTab('queue')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onSelectTransaction={(txn) => setSelectedTransaction(txn)}
          />
        )}

        {activeTab === 'queue' && (
          <RecoveryQueueView
            onSelectTransaction={(txn) => setSelectedTransaction(txn)}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'simulator' && <SimulatorView />}
      </main>

      {/* Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onActionSuccess={handleTransactionActionSuccess}
      />
    </div>
  );
}

export default App;
