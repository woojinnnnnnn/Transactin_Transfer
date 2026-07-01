import type { Chain } from 'viem';
import type { NormalizedTransaction } from '../types/activity';
import { SkeletonCard } from './SkeletonCard';
import { TransactionCard } from './TransactionCard';

export function TransactionList({
  activeChainSymbol,
  chain,
  copiedAddress,
  copiedTransactionId,
  expandedTransactionId,
  isConnected,
  isFetching,
  onCopyAddress,
  onCopyHash,
  onToggleTransaction,
  transactions,
}: {
  activeChainSymbol?: string;
  chain?: Chain;
  copiedAddress: string | null;
  copiedTransactionId: string | null;
  expandedTransactionId: string | null;
  isConnected: boolean;
  isFetching: boolean;
  onCopyAddress: (address: string) => void;
  onCopyHash: (hash: string) => void;
  onToggleTransaction: (transactionId: string) => void;
  transactions: NormalizedTransaction[];
}) {
  return (
    <section className="transaction-list" aria-label="recent transactions">
      {isFetching &&
        Array.from({ length: 5 }, (_, i) => (
          <SkeletonCard key={i} delay={i * 90} />
        ))
      }
      {!isFetching && isConnected && transactions.length === 0 && (
        <div className="empty-state">
          No recent movement history found for this wallet.
        </div>
      )}
      {!isFetching &&
        transactions.map((transaction) => (
          <TransactionCard
            activeChainSymbol={activeChainSymbol}
            chain={chain}
            copiedAddress={copiedAddress}
            copiedTransactionId={copiedTransactionId}
            isConnected={isConnected}
            isExpanded={expandedTransactionId === transaction.id}
            key={transaction.id}
            onCopyAddress={onCopyAddress}
            onCopyHash={onCopyHash}
            onToggle={onToggleTransaction}
            transaction={transaction}
          />
        ))}
    </section>
  );
}
