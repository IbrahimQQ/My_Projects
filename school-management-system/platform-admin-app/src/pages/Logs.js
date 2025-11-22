import React, { useState, useEffect } from 'react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const schools = [
    { id: '1', name: 'Lincoln High School' },
    { id: '2', name: 'Washington Academy' },
    { id: '3', name: 'Jefferson Elementary' },
    { id: '4', name: 'Kennedy Preparatory' }
  ];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const mockLogs = [
        { id: 1, type: 'auth', action: 'User Login', user: 'superadmin@platform.com', school: 'Platform', ip: '192.168.1.100', timestamp: '2024-01-20T14:30:00Z', details: 'Successful login' },
        { id: 2, type: 'school', action: 'School Created', user: 'superadmin@platform.com', school: 'Platform', ip: '192.168.1.100', timestamp: '2024-01-20T14:25:00Z', details: 'Created school: Roosevelt Middle School' },
        { id: 3, type: 'user', action: 'User Created', user: 'admin@lincoln.edu', school: 'Lincoln High School', ip: '192.168.1.101', timestamp: '2024-01-20T13:45:00Z', details: 'Created teacher account' },
        { id: 4, type: 'billing', action: 'Payment Received', user: 'System', school: 'Washington Academy', ip: '-', timestamp: '2024-01-20T12:00:00Z', details: 'Monthly subscription payment: $199' },
        { id: 5, type: 'auth', action: 'User Login', user: 'principal@lincoln.edu', school: 'Lincoln High School', ip: '192.168.1.102', timestamp: '2024-01-20T11:30:00Z', details: 'Successful login' },
        { id: 6, type: 'settings', action: 'Settings Updated', user: 'superadmin@platform.com', school: 'Platform', ip: '192.168.1.100', timestamp: '2024-01-20T10:15:00Z', details: 'Updated email settings' },
        { id: 7, type: 'school', action: 'Subscription Extended', user: 'superadmin@platform.com', school: 'Kennedy Preparatory', ip: '192.168.1.100', timestamp: '2024-01-20T09:45:00Z', details: 'Extended subscription by 6 months' },
        { id: 8, type: 'auth', action: 'Failed Login', user: 'unknown@test.com', school: '-', ip: '10.0.0.55', timestamp: '2024-01-20T08:30:00Z', details: 'Invalid credentials' },
        { id: 9, type: 'backup', action: 'Backup Created', user: 'System', school: 'All Schools', ip: '-', timestamp: '2024-01-20T03:00:00Z', details: 'Daily automated backup completed' },
        { id: 10, type: 'user', action: 'Password Reset', user: 'teacher1@washington.edu', school: 'Washington Academy', ip: '192.168.1.150', timestamp: '2024-01-19T16:20:00Z', details: 'Password reset requested' },
        { id: 11, type: 'school', action: 'School Suspended', user: 'superadmin@platform.com', school: 'Adams High School', ip: '192.168.1.100', timestamp: '2024-01-19T15:00:00Z', details: 'Suspended due to payment issues' },
        { id: 12, type: 'billing', action: 'Invoice Generated', user: 'System', school: 'Lincoln High School', ip: '-', timestamp: '2024-01-19T00:00:00Z', details: 'Monthly invoice INV-008 generated' }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSchool = filterSchool === 'all' || log.school === schools.find(s => s.id === filterSchool)?.name || log.school === 'Platform';
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSchool && matchesSearch;
  });

  const getTypeIcon = (type) => {
    const icons = {
      auth: '🔐',
      school: '🏫',
      user: '👤',
      billing: '💳',
      settings: '⚙️',
      backup: '💾'
    };
    return icons[type] || '📋';
  };

  const getTypeBadge = (type) => {
    const badges = {
      auth: 'purple',
      school: 'info',
      user: 'success',
      billing: 'warning',
      settings: 'secondary',
      backup: 'info'
    };
    return badges[type] || 'info';
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
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">Monitor all platform activity and events</p>
        </div>
        <button className="btn btn-secondary">
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{logs.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Auth Events</div>
          <div className="stat-value">{logs.filter(l => l.type === 'auth').length}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">School Events</div>
          <div className="stat-value">{logs.filter(l => l.type === 'school').length}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Billing Events</div>
          <div className="stat-value">{logs.filter(l => l.type === 'billing').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="auth">Authentication</option>
            <option value="school">School</option>
            <option value="user">User</option>
            <option value="billing">Billing</option>
            <option value="settings">Settings</option>
            <option value="backup">Backup</option>
          </select>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
          >
            <option value="all">All Schools</option>
            <option value="platform">Platform Only</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          <div style={{ marginLeft: 'auto', color: '#888' }}>
            {filteredLogs.length} events found
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Action</th>
                <th>User</th>
                <th>School</th>
                <th>IP Address</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`badge badge-${getTypeBadge(log.type)}`}>
                      {getTypeIcon(log.type)} {log.type}
                    </span>
                  </td>
                  <td><strong>{log.action}</strong></td>
                  <td style={{ fontSize: '13px' }}>{log.user}</td>
                  <td>{log.school}</td>
                  <td style={{ fontSize: '12px', color: '#888' }}>{log.ip}</td>
                  <td style={{ fontSize: '13px' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '13px', color: '#aaa', maxWidth: '200px' }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Security Alerts</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.filter(l => l.action.includes('Failed')).length > 0 ? (
            logs
              .filter(l => l.action.includes('Failed'))
              .map((log) => (
                <div
                  key={log.id}
                  className="alert alert-error"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong>{log.action}</strong>
                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#aaa' }}>
                      {log.user} from {log.ip}
                    </span>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm">
                    Block IP
                  </button>
                </div>
              ))
          ) : (
            <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>
              No security alerts at this time
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
