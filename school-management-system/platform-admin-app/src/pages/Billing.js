import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Mock billing data
      const mockStats = {
        totalRevenue: 156780,
        monthlyRevenue: 12500,
        pendingPayments: 2390,
        overduePayments: 799,
        revenueHistory: [8500, 9200, 10100, 11000, 11800, 12500]
      };

      const mockInvoices = [
        { id: 'INV-001', school: 'Lincoln High School', amount: 399, status: 'paid', date: '2024-01-15', dueDate: '2024-01-31', plan: 'premium' },
        { id: 'INV-002', school: 'Washington Academy', amount: 199, status: 'paid', date: '2024-01-15', dueDate: '2024-01-31', plan: 'standard' },
        { id: 'INV-003', school: 'Jefferson Elementary', amount: 99, status: 'pending', date: '2024-01-20', dueDate: '2024-02-05', plan: 'basic' },
        { id: 'INV-004', school: 'Kennedy Preparatory', amount: 799, status: 'paid', date: '2024-01-10', dueDate: '2024-01-25', plan: 'enterprise' },
        { id: 'INV-005', school: 'Adams Middle School', amount: 199, status: 'overdue', date: '2023-12-15', dueDate: '2023-12-31', plan: 'standard' },
        { id: 'INV-006', school: 'Monroe Elementary', amount: 99, status: 'paid', date: '2024-01-05', dueDate: '2024-01-20', plan: 'basic' },
        { id: 'INV-007', school: 'Madison High', amount: 399, status: 'pending', date: '2024-01-18', dueDate: '2024-02-02', plan: 'premium' }
      ];

      setStats(mockStats);
      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = (invoice) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
    ));
  };

  const handleSendReminder = (invoice) => {
    alert(`Reminder sent to ${invoice.school}`);
  };

  const filteredInvoices = invoices.filter(inv =>
    filterStatus === 'all' || inv.status === filterStatus
  );

  const revenueChartData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: stats?.revenueHistory || [],
        fill: true,
        borderColor: '#43e97b',
        backgroundColor: 'rgba(67, 233, 123, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { color: '#2a2a4a' }, ticks: { color: '#888' } },
      y: { grid: { color: '#2a2a4a' }, ticks: { color: '#888' } }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Revenue</h1>
          <p className="page-subtitle">Manage invoices and track revenue across all schools</p>
        </div>
        <button className="btn btn-primary">
          + Generate Invoice
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-change positive">All time</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">${stats.monthlyRevenue.toLocaleString()}</div>
          <div className="stat-change positive">↑ 5.9% from last month</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Pending Payments</div>
          <div className="stat-value">${stats.pendingPayments.toLocaleString()}</div>
          <div className="stat-change">{invoices.filter(i => i.status === 'pending').length} invoices</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">${stats.overduePayments.toLocaleString()}</div>
          <div className="stat-change negative">{invoices.filter(i => i.status === 'overdue').length} invoices</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Revenue Trend</h3>
        </div>
        <div style={{ height: '250px' }}>
          <Line data={revenueChartData} options={chartOptions} />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invoices</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              className="form-select"
              style={{ width: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>School</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.id}</strong></td>
                  <td>{invoice.school}</td>
                  <td>
                    <span className={`badge badge-${getPlanBadge(invoice.plan)}`}>
                      {invoice.plan}
                    </span>
                  </td>
                  <td><strong>${invoice.amount}</strong></td>
                  <td>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowInvoiceModal(true);
                        }}
                      >
                        View
                      </button>
                      {invoice.status !== 'paid' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleMarkPaid(invoice)}
                          >
                            Mark Paid
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSendReminder(invoice)}
                          >
                            Remind
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Invoice {selectedInvoice.id}</h2>
              <button className="modal-close" onClick={() => setShowInvoiceModal(false)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow label="School" value={selectedInvoice.school} />
              <InfoRow label="Plan" value={selectedInvoice.plan} />
              <InfoRow label="Amount" value={`$${selectedInvoice.amount}`} />
              <InfoRow label="Invoice Date" value={new Date(selectedInvoice.date).toLocaleDateString()} />
              <InfoRow label="Due Date" value={new Date(selectedInvoice.dueDate).toLocaleDateString()} />
              <InfoRow
                label="Status"
                value={<span className={`badge badge-${getStatusBadge(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                Close
              </button>
              <button className="btn btn-primary">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#888' }}>{label}</span>
    <span style={{ color: '#fff' }}>{value}</span>
  </div>
);

const getPlanBadge = (plan) => {
  const badges = { trial: 'warning', basic: 'info', standard: 'success', premium: 'purple', enterprise: 'danger' };
  return badges[plan] || 'info';
};

const getStatusBadge = (status) => {
  const badges = { paid: 'success', pending: 'warning', overdue: 'danger' };
  return badges[status] || 'info';
};

export default Billing;
