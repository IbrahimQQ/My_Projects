import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolService } from '../services/api';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subdomain: '',
    email: '',
    phone: '',
    address: '',
    plan: 'trial',
    maxStudents: 100,
    maxTeachers: 20,
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      // Mock data for demonstration
      const mockSchools = [
        {
          id: '1',
          name: 'Lincoln High School',
          code: 'LINCOLN',
          subdomain: 'lincoln',
          email: 'admin@lincoln.edu',
          phone: '555-0101',
          plan: 'premium',
          maxStudents: 1000,
          maxTeachers: 100,
          currentStudents: 850,
          currentTeachers: 65,
          isActive: true,
          subscriptionEndDate: '2024-12-31',
          createdAt: '2023-06-15'
        },
        {
          id: '2',
          name: 'Washington Academy',
          code: 'WASHINGTON',
          subdomain: 'washington',
          email: 'admin@washington.edu',
          phone: '555-0102',
          plan: 'standard',
          maxStudents: 500,
          maxTeachers: 50,
          currentStudents: 420,
          currentTeachers: 38,
          isActive: true,
          subscriptionEndDate: '2024-09-30',
          createdAt: '2023-08-20'
        },
        {
          id: '3',
          name: 'Jefferson Elementary',
          code: 'JEFFERSON',
          subdomain: 'jefferson',
          email: 'admin@jefferson.edu',
          phone: '555-0103',
          plan: 'basic',
          maxStudents: 300,
          maxTeachers: 30,
          currentStudents: 280,
          currentTeachers: 22,
          isActive: true,
          subscriptionEndDate: '2024-06-30',
          createdAt: '2023-09-01'
        },
        {
          id: '4',
          name: 'Roosevelt Middle School',
          code: 'ROOSEVELT',
          subdomain: 'roosevelt',
          email: 'admin@roosevelt.edu',
          phone: '555-0104',
          plan: 'trial',
          maxStudents: 100,
          maxTeachers: 20,
          currentStudents: 75,
          currentTeachers: 8,
          isActive: true,
          subscriptionEndDate: '2024-02-15',
          createdAt: '2024-01-15'
        },
        {
          id: '5',
          name: 'Kennedy Preparatory',
          code: 'KENNEDY',
          subdomain: 'kennedy',
          email: 'admin@kennedy.edu',
          phone: '555-0105',
          plan: 'enterprise',
          maxStudents: 2000,
          maxTeachers: 200,
          currentStudents: 1450,
          currentTeachers: 120,
          isActive: true,
          subscriptionEndDate: '2025-12-31',
          createdAt: '2022-01-10'
        }
      ];
      setSchools(mockSchools);
    } catch (error) {
      console.error('Failed to load schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchool) {
        // Update existing school
        const updatedSchools = schools.map(s =>
          s.id === editingSchool.id ? { ...s, ...formData } : s
        );
        setSchools(updatedSchools);
      } else {
        // Create new school
        const newSchool = {
          id: Date.now().toString(),
          ...formData,
          currentStudents: 0,
          currentTeachers: 0,
          isActive: true,
          subscriptionEndDate: getTrialEndDate(),
          createdAt: new Date().toISOString()
        };
        setSchools([newSchool, ...schools]);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save school:', error);
    }
  };

  const getTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleToggleStatus = async (school) => {
    const updatedSchools = schools.map(s =>
      s.id === school.id ? { ...s, isActive: !s.isActive } : s
    );
    setSchools(updatedSchools);
  };

  const openCreateModal = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      code: '',
      subdomain: '',
      email: '',
      phone: '',
      address: '',
      plan: 'trial',
      maxStudents: 100,
      maxTeachers: 20,
      adminName: '',
      adminEmail: '',
      adminPassword: ''
    });
    setShowModal(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      subdomain: school.subdomain,
      email: school.email,
      phone: school.phone,
      address: school.address || '',
      plan: school.plan,
      maxStudents: school.maxStudents,
      maxTeachers: school.maxTeachers,
      adminName: '',
      adminEmail: '',
      adminPassword: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchool(null);
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || school.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const planPrices = {
    trial: 0,
    basic: 99,
    standard: 199,
    premium: 399,
    enterprise: 799
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
          <h1 className="page-title">School Management</h1>
          <p className="page-subtitle">Create, manage, and monitor all schools on the platform</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Add New School
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <div style={{ marginLeft: 'auto', color: '#888' }}>
            {filteredSchools.length} schools found
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>School</th>
                <th>Plan</th>
                <th>Students</th>
                <th>Teachers</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.id}>
                  <td>
                    <div>
                      <strong>{school.name}</strong>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {school.code} • {school.subdomain}.schoolsaas.com
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${getPlanBadge(school.plan)}`}>
                      {school.plan}
                    </span>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      ${planPrices[school.plan]}/mo
                    </div>
                  </td>
                  <td>
                    <div>{school.currentStudents} / {school.maxStudents}</div>
                    <div className="progress-bar" style={{ width: '80px', marginTop: '4px' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${(school.currentStudents / school.maxStudents) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <div>{school.currentTeachers} / {school.maxTeachers}</div>
                    <div className="progress-bar" style={{ width: '80px', marginTop: '4px' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${(school.currentTeachers / school.maxTeachers) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <div>{new Date(school.subscriptionEndDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: getDaysRemaining(school.subscriptionEndDate) < 30 ? '#f5576c' : '#888' }}>
                      {getDaysRemaining(school.subscriptionEndDate)} days left
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${school.isActive ? 'success' : 'danger'}`}>
                      {school.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/schools/${school.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(school)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${school.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(school)}
                      >
                        {school.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingSchool ? 'Edit School' : 'Create New School'}
              </h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">School Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">School Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Subdomain *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    placeholder="e.g., lincoln"
                    required
                  />
                  <small style={{ color: '#888' }}>{formData.subdomain || 'subdomain'}.schoolsaas.com</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Plan *</label>
                  <select
                    className="form-select"
                    value={formData.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const limits = getPlanLimits(plan);
                      setFormData({ ...formData, plan, ...limits });
                    }}
                  >
                    <option value="trial">Trial (Free - 30 days)</option>
                    <option value="basic">Basic ($99/month)</option>
                    <option value="standard">Standard ($199/month)</option>
                    <option value="premium">Premium ($399/month)</option>
                    <option value="enterprise">Enterprise ($799/month)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Max Students</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Teachers</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.maxTeachers}
                    onChange={(e) => setFormData({ ...formData, maxTeachers: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {!editingSchool && (
                <>
                  <h4 style={{ margin: '24px 0 16px', color: '#fff' }}>School Admin Account</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Admin Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        required={!editingSchool}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Admin Email *</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        required={!editingSchool}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      required={!editingSchool}
                      minLength={8}
                    />
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSchool ? 'Save Changes' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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

const getPlanLimits = (plan) => {
  const limits = {
    trial: { maxStudents: 100, maxTeachers: 20 },
    basic: { maxStudents: 300, maxTeachers: 30 },
    standard: { maxStudents: 500, maxTeachers: 50 },
    premium: { maxStudents: 1000, maxTeachers: 100 },
    enterprise: { maxStudents: 5000, maxTeachers: 500 }
  };
  return limits[plan] || limits.trial;
};

const getDaysRemaining = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

export default Schools;
