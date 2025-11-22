import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const SchoolDetail = () => {
  const { id } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extensionMonths, setExtensionMonths] = useState(1);

  useEffect(() => {
    loadSchoolData();
  }, [id]);

  const loadSchoolData = async () => {
    try {
      // Mock data for demonstration
      const mockSchool = {
        id: id,
        name: 'Lincoln High School',
        code: 'LINCOLN',
        subdomain: 'lincoln',
        email: 'admin@lincoln.edu',
        phone: '555-0101',
        address: '123 Education Lane, Springfield, IL 62701',
        plan: 'premium',
        maxStudents: 1000,
        maxTeachers: 100,
        currentStudents: 850,
        currentTeachers: 65,
        isActive: true,
        subscriptionStartDate: '2023-06-15',
        subscriptionEndDate: '2024-12-31',
        createdAt: '2023-06-15',
        storageUsed: 2.5, // GB
        storageLimit: 10, // GB
        monthlyFee: 399,
        features: {
          reportCards: true,
          attendance: true,
          gradebook: true,
          messaging: true,
          parentPortal: true,
          analytics: true
        },
        stats: {
          totalClasses: 45,
          totalSubjects: 12,
          averageAttendance: 94.5,
          averageGrade: 82.3
        },
        recentActivity: [
          { action: 'User Login', user: 'Principal Johnson', time: '2 hours ago' },
          { action: 'Report Generated', user: 'Teacher Smith', time: '4 hours ago' },
          { action: 'Student Added', user: 'Admin Wilson', time: '1 day ago' },
          { action: 'Fee Payment Recorded', user: 'Accountant Brown', time: '2 days ago' }
        ],
        admins: [
          { name: 'John Wilson', email: 'admin@lincoln.edu', role: 'admin', lastLogin: '2024-01-20' },
          { name: 'Sarah Johnson', email: 'principal@lincoln.edu', role: 'principal', lastLogin: '2024-01-20' }
        ],
        payments: [
          { date: '2024-01-01', amount: 399, status: 'paid', method: 'Credit Card' },
          { date: '2023-12-01', amount: 399, status: 'paid', method: 'Credit Card' },
          { date: '2023-11-01', amount: 399, status: 'paid', method: 'Bank Transfer' }
        ]
      };
      setSchool(mockSchool);
    } catch (error) {
      console.error('Failed to load school:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = () => {
    const endDate = new Date(school.subscriptionEndDate);
    endDate.setMonth(endDate.getMonth() + extensionMonths);
    setSchool({ ...school, subscriptionEndDate: endDate.toISOString().split('T')[0] });
    setShowExtendModal(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!school) {
    return <div>School not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/schools" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Schools
          </Link>
          <h1 className="page-title" style={{ marginTop: '8px' }}>{school.name}</h1>
          <p className="page-subtitle">{school.code} • {school.subdomain}.schoolsaas.com</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => setShowExtendModal(true)}>
            Extend Subscription
          </button>
          <button className={`btn ${school.isActive ? 'btn-danger' : 'btn-success'}`}>
            {school.isActive ? 'Suspend School' : 'Activate School'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card purple">
              <div className="stat-label">Students</div>
              <div className="stat-value">{school.currentStudents}</div>
              <div className="stat-change">
                of {school.maxStudents} max
              </div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Teachers</div>
              <div className="stat-value">{school.currentTeachers}</div>
              <div className="stat-change">
                of {school.maxTeachers} max
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Avg Attendance</div>
              <div className="stat-value">{school.stats.averageAttendance}%</div>
              <div className="stat-change positive">
                <span>↑</span> Good standing
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-label">Avg Grade</div>
              <div className="stat-value">{school.stats.averageGrade}%</div>
              <div className="stat-change positive">
                <span>↑</span> B Grade
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* School Info */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>School Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InfoRow label="Email" value={school.email} />
                <InfoRow label="Phone" value={school.phone} />
                <InfoRow label="Address" value={school.address} />
                <InfoRow label="Created" value={new Date(school.createdAt).toLocaleDateString()} />
              </div>
            </div>

            {/* Subscription Info */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>Subscription</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InfoRow
                  label="Plan"
                  value={<span className={`badge badge-${getPlanBadge(school.plan)}`}>{school.plan}</span>}
                />
                <InfoRow label="Monthly Fee" value={`$${school.monthlyFee}`} />
                <InfoRow label="Start Date" value={new Date(school.subscriptionStartDate).toLocaleDateString()} />
                <InfoRow label="End Date" value={new Date(school.subscriptionEndDate).toLocaleDateString()} />
                <InfoRow
                  label="Status"
                  value={<span className={`badge badge-${school.isActive ? 'success' : 'danger'}`}>
                    {school.isActive ? 'Active' : 'Suspended'}
                  </span>}
                />
              </div>
            </div>
          </div>

          {/* Storage & Features */}
          <div className="grid-2" style={{ marginTop: '24px' }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>Storage Usage</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{school.storageUsed} GB used</span>
                  <span>{school.storageLimit} GB total</span>
                </div>
                <div className="progress-bar" style={{ height: '12px' }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${(school.storageUsed / school.storageLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
              <p style={{ color: '#888', fontSize: '13px' }}>
                {((school.storageUsed / school.storageLimit) * 100).toFixed(1)}% of storage used
              </p>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>Enabled Features</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(school.features).map(([feature, enabled]) => (
                  <span
                    key={feature}
                    className={`badge ${enabled ? 'badge-success' : 'badge-danger'}`}
                  >
                    {enabled ? '✓' : '✗'} {formatFeatureName(feature)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">School Administrators</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {school.admins.map((admin, index) => (
                  <tr key={index}>
                    <td><strong>{admin.name}</strong></td>
                    <td>{admin.email}</td>
                    <td>
                      <span className="badge badge-purple">{admin.role}</span>
                    </td>
                    <td>{new Date(admin.lastLogin).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm">Reset Password</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payment History</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {school.payments.map((payment, index) => (
                  <tr key={index}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td><strong>${payment.amount}</strong></td>
                    <td>
                      <span className={`badge badge-${payment.status === 'paid' ? 'success' : 'warning'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {school.recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #2a2a4a'
                }}
              >
                <div>
                  <strong>{activity.action}</strong>
                  <div style={{ fontSize: '13px', color: '#888' }}>{activity.user}</div>
                </div>
                <div style={{ color: '#888', fontSize: '13px' }}>{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {showExtendModal && (
        <div className="modal-overlay" onClick={() => setShowExtendModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Extend Subscription</h2>
              <button className="modal-close" onClick={() => setShowExtendModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Extension Period</label>
              <select
                className="form-select"
                value={extensionMonths}
                onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
              >
                <option value={1}>1 Month (+$399)</option>
                <option value={3}>3 Months (+$1,197)</option>
                <option value={6}>6 Months (+$2,394)</option>
                <option value={12}>12 Months (+$4,788)</option>
              </select>
            </div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
              Current end date: {new Date(school.subscriptionEndDate).toLocaleDateString()}
              <br />
              New end date: {(() => {
                const date = new Date(school.subscriptionEndDate);
                date.setMonth(date.getMonth() + extensionMonths);
                return date.toLocaleDateString();
              })()}
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleExtendSubscription}>
                Extend Subscription
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
  const badges = {
    trial: 'warning',
    basic: 'info',
    standard: 'success',
    premium: 'purple',
    enterprise: 'danger'
  };
  return badges[plan] || 'info';
};

const formatFeatureName = (name) => {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

export default SchoolDetail;
