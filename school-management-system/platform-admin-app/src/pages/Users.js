import React, { useState, useEffect } from 'react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const schools = [
    { id: '1', name: 'Lincoln High School' },
    { id: '2', name: 'Washington Academy' },
    { id: '3', name: 'Jefferson Elementary' },
    { id: '4', name: 'Kennedy Preparatory' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const mockUsers = [
        { id: 1, name: 'John Wilson', email: 'admin@lincoln.edu', role: 'admin', school: 'Lincoln High School', schoolId: '1', status: 'active', lastLogin: '2024-01-20' },
        { id: 2, name: 'Sarah Johnson', email: 'principal@lincoln.edu', role: 'principal', school: 'Lincoln High School', schoolId: '1', status: 'active', lastLogin: '2024-01-20' },
        { id: 3, name: 'Michael Smith', email: 'teacher1@lincoln.edu', role: 'teacher', school: 'Lincoln High School', schoolId: '1', status: 'active', lastLogin: '2024-01-19' },
        { id: 4, name: 'Emily Brown', email: 'admin@washington.edu', role: 'admin', school: 'Washington Academy', schoolId: '2', status: 'active', lastLogin: '2024-01-18' },
        { id: 5, name: 'David Lee', email: 'principal@washington.edu', role: 'principal', school: 'Washington Academy', schoolId: '2', status: 'active', lastLogin: '2024-01-20' },
        { id: 6, name: 'Jennifer Davis', email: 'accountant@lincoln.edu', role: 'accountant', school: 'Lincoln High School', schoolId: '1', status: 'active', lastLogin: '2024-01-17' },
        { id: 7, name: 'Robert Taylor', email: 'teacher2@washington.edu', role: 'teacher', school: 'Washington Academy', schoolId: '2', status: 'inactive', lastLogin: '2023-12-15' },
        { id: 8, name: 'Lisa Anderson', email: 'admin@jefferson.edu', role: 'admin', school: 'Jefferson Elementary', schoolId: '3', status: 'active', lastLogin: '2024-01-19' },
        { id: 9, name: 'James Wilson', email: 'principal@jefferson.edu', role: 'principal', school: 'Jefferson Elementary', schoolId: '3', status: 'active', lastLogin: '2024-01-20' },
        { id: 10, name: 'Maria Garcia', email: 'admin@kennedy.edu', role: 'admin', school: 'Kennedy Preparatory', schoolId: '4', status: 'active', lastLogin: '2024-01-20' }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (user) => {
    setUsers(users.map(u =>
      u.id === user.id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  const handleResetPassword = (user) => {
    alert(`Password reset email sent to ${user.email}`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSchool = filterSchool === 'all' || user.schoolId === filterSchool;
    return matchesSearch && matchesRole && matchesSchool;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    principals: users.filter(u => u.role === 'principal').length,
    teachers: users.filter(u => u.role === 'teacher').length
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
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage users across all schools on the platform</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">School Admins</div>
          <div className="stat-value">{stats.admins}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Principals</div>
          <div className="stat-value">{stats.principals}</div>
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="principal">Principal</option>
            <option value="teacher">Teacher</option>
            <option value="accountant">Accountant</option>
            <option value="parent">Parent</option>
          </select>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
          >
            <option value="all">All Schools</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          <div style={{ marginLeft: 'auto', color: '#888' }}>
            {filteredUsers.length} users found
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>School</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <strong>{user.name}</strong>
                        <div style={{ fontSize: '12px', color: '#888' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.school}</td>
                  <td>
                    <span className={`badge badge-${user.status === 'active' ? 'success' : 'danger'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.lastLogin).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResetPassword(user)}
                      >
                        Reset PW
                      </button>
                      <button
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">User Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="user-avatar" style={{ width: '80px', height: '80px', fontSize: '32px', margin: '0 auto 16px' }}>
                {selectedUser.name.charAt(0)}
              </div>
              <h3 style={{ color: '#fff', marginBottom: '4px' }}>{selectedUser.name}</h3>
              <p style={{ color: '#888' }}>{selectedUser.email}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow label="Role" value={<span className={`badge badge-${getRoleBadge(selectedUser.role)}`}>{selectedUser.role}</span>} />
              <InfoRow label="School" value={selectedUser.school} />
              <InfoRow label="Status" value={<span className={`badge badge-${selectedUser.status === 'active' ? 'success' : 'danger'}`}>{selectedUser.status}</span>} />
              <InfoRow label="Last Login" value={new Date(selectedUser.lastLogin).toLocaleString()} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className="btn btn-secondary" onClick={() => handleResetPassword(selectedUser)}>
                Reset Password
              </button>
              <button
                className={`btn ${selectedUser.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                onClick={() => {
                  handleToggleStatus(selectedUser);
                  setSelectedUser({ ...selectedUser, status: selectedUser.status === 'active' ? 'inactive' : 'active' });
                }}
              >
                {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
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

const getRoleBadge = (role) => {
  const badges = {
    admin: 'purple',
    principal: 'info',
    teacher: 'success',
    accountant: 'warning',
    parent: 'secondary'
  };
  return badges[role] || 'info';
};

export default Users;
