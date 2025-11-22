import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../services/api';
import { ArrowLeft, Printer, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoiceService.getById(id) });
  const invoice = data?.data?.data;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getStatusBadge = (status) => {
    const styles = { paid: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700', pending: 'bg-orange-100 text-orange-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600' };
    return <span className={`px-3 py-1 text-sm rounded-full capitalize ${styles[status] || styles.pending}`}>{status}</span>;
  };

  if (isLoading) return <div className="card animate-pulse"><div className="h-64 bg-gray-200 rounded" /></div>;
  if (!invoice) return <div className="card text-center py-12"><p className="text-gray-500">Invoice not found</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-gray-500">Created {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invoice.status)}
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2"><Printer size={18} /> Print</button>
          {invoice.status !== 'paid' && <Link to={`/payments/new?invoiceId=${invoice.id}`} className="btn-primary flex items-center gap-2"><CreditCard size={18} /> Record Payment</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Content */}
          <div className="card">
            <div className="flex justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Bill To:</h3>
                <p className="font-medium">{invoice.Student?.firstName} {invoice.Student?.lastName}</p>
                <p className="text-gray-500">{invoice.Student?.Class?.name}</p>
                <p className="text-gray-500">{invoice.Student?.Parent?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-mono font-bold">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500 mt-2">Due Date</p>
                <p className={`font-medium ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-600' : ''}`}>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
              </div>
            </div>

            <table className="w-full mb-6">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.totalAmount)}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>-{formatCurrency(invoice.paidAmount)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Balance Due</span><span className={parseFloat(invoice.balanceAmount) > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(invoice.balanceAmount)}</span></div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-gray-600 text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment History */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><CreditCard size={18} /> Payment History</h3>
            {invoice.Payments?.length > 0 ? (
              <div className="space-y-3">
                {invoice.Payments.map(payment => (
                  <div key={payment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p><p className="text-xs text-gray-500">{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</p></div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">{payment.method}</span>
                    </div>
                    {payment.reference && <p className="text-xs text-gray-500 mt-1">Ref: {payment.reference}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">No payments recorded</p>}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              {invoice.status !== 'paid' && <Link to={`/payments/new?invoiceId=${invoice.id}`} className="btn-primary w-full flex items-center justify-center gap-2"><CreditCard size={18} /> Record Payment</Link>}
              <button className="btn-secondary w-full flex items-center justify-center gap-2"><FileText size={18} /> Download PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
