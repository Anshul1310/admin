import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Plus,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { api } from '../lib/api';
import type { Payment, Pagination } from '../types';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual Verify Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    team_id: '',
    amount: 200,
    payment_status: 'SUCCESS',
    transaction_id: '',
    notes: 'Verified by administrator',
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchPayments = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const res = await api.payments.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page: pageToLoad,
        limit: 15,
      });

      if (res.success && res.data) {
        setPayments(res.data.payments || []);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  const handleManualVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFormData.team_id.trim()) {
      showNotification('error', 'Team ID is required');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await api.payments.verifyManual({
        team_id: manualFormData.team_id.trim(),
        amount: Number(manualFormData.amount) || 200,
        payment_status: manualFormData.payment_status,
        transaction_id: manualFormData.transaction_id.trim() || 'MANUAL_' + Date.now(),
        notes: manualFormData.notes,
      });

      if (res.success) {
        showNotification('success', `Payment verified for squad ${manualFormData.team_id}`);
        setIsManualModalOpen(false);
        setManualFormData({
          team_id: '',
          amount: 200,
          payment_status: 'SUCCESS',
          transaction_id: '',
          notes: 'Verified by administrator',
        });
        fetchPayments(1);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Payment Reconciliation"
        subtitle={`Tracking Cashfree checkout orders and manual payment logs (${pagination.total} records)`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => api.payments.downloadCsv()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-soft"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-soft"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Verification</span>
            </button>
          </div>
        }
      />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              &times;
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, team ID, squad name, transaction ID, or participant email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="">All Payment Records</option>
              <option value="SUCCESS">SUCCESS / PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED / CANCELLED</option>
            </select>

            {(search || statusFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-5">Order / Payment ID</th>
                  <th className="py-3.5 px-4">Team Squad</th>
                  <th className="py-3.5 px-4">Paid By</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Gateway Reference</th>
                  <th className="py-3.5 px-5 text-right">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
                        <span className="font-medium">Fetching payment reconciliation logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        icon={CreditCard}
                        title="No payment logs found"
                        description="No transactions match your current search or filter query."
                        action={{
                          label: 'Record Manual Payment',
                          onClick: () => setIsManualModalOpen(true),
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-slate-900">{p.order_id || p.payment_id}</span>
                          <button
                            onClick={() => copyToClipboard(p.order_id || p.payment_id)}
                            className="p-0.5 text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            {copiedId === (p.order_id || p.payment_id) ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800">{p.team_name || p.team_id}</p>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">{p.team_id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-slate-800">{p.user_name || 'System / Direct'}</p>
                          {p.user_email && <p className="text-[10px] text-slate-500">{p.user_email}</p>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.payment_status} />
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-medium">
                        {p.transaction_id || <span className="italic text-slate-400 font-normal">Automated Webhook</span>}
                        {p.raw_webhook_data && (
                          <span className="block text-[10px] text-slate-500 truncate max-w-xs">{p.raw_webhook_data}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right text-[11px] text-slate-500 font-medium">
                        <div>
                          <span className="text-slate-800 font-semibold block">{new Date(p.created_at).toLocaleDateString()}</span>
                          <span>{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>
                Showing page <strong className="text-slate-900 font-bold">{pagination.page}</strong> of <strong className="text-slate-900 font-bold">{pagination.pages}</strong> ({pagination.total} records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchPayments(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchPayments(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Manual Verify Modal */}
      {isManualModalOpen && (
        <Modal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          title="Manual Payment Verification"
          subtitle="Record an offline payment (UPI, Cash, or Waiver) and approve the squad"
          maxWidth="md"
        >
          <form onSubmit={handleManualVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Team ID / Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={manualFormData.team_id}
                onChange={(e) => setManualFormData({ ...manualFormData, team_id: e.target.value })}
                placeholder="e.g. TEAM-ABC12345"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR)</label>
                <input
                  type="number"
                  value={manualFormData.amount}
                  onChange={(e) => setManualFormData({ ...manualFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={manualFormData.payment_status}
                  onChange={(e) => setManualFormData({ ...manualFormData, payment_status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="SUCCESS">SUCCESS / PAID</option>
                  <option value="WAIVED">WAIVED (FREE ENTRY)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Ref / UPI UTR
              </label>
              <input
                type="text"
                value={manualFormData.transaction_id}
                onChange={(e) => setManualFormData({ ...manualFormData, transaction_id: e.target.value })}
                placeholder="e.g. UPI/1234567890/SBI"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Notes / Approval Reason
              </label>
              <textarea
                rows={2}
                value={manualFormData.notes}
                onChange={(e) => setManualFormData({ ...manualFormData, notes: e.target.value })}
                placeholder="e.g. Paid in cash to Tech Affairs Lead at desk"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-soft disabled:opacity-50"
              >
                {isVerifying ? 'Confirming...' : 'Confirm Verification'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
