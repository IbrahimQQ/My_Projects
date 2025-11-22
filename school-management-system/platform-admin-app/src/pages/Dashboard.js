import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { schoolService } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSchools, setRecentSchools] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // In production, these would be real API calls
      // For now, using mock data that matches the structure
      const mockStats = {
        totalSchools: 15,
        activeSchools: 12,
        totalStudents: 4250,
        totalTeachers: 320,
        totalRevenue: 45000,
        monthlyGrowth: 12.5,
        planDistribution: {
          trial: 3,
          basic: 4,
          standard: 5,
          premium: 2,
          enterprise: 1
        },
        revenueHistory: [35000, 38000, 40000, 42000, 43500, 45000]
      };

      const mockRecentSchools = [
        { id: 1, name: 'Lincoln High School', plan: 'premium', students: 850, status: 'active', createdAt: '2024-01-15' },
        { id: 2, name: 'Washington Academy', plan: 'standard', students: 620, status: 'active', createdAt: '2024-01-10' },
        { id: 3, name: 'Jefferson Elementary', plan: 'basic', students: 380, status: 'active', createdAt: '2024-01-05' },
        { id: 4, name: 'Roosevelt Middle School', plan: 'trial', students: 150, status: 'trial', createdAt: '2024-01-20' },
        { id: 5, name: 'Kennedy Prep', plan: 'enterprise', students: 1200, status: 'active', createdAt: '2023-12-01' }
      ];

      setStats(mockStats);
      setRecentSchools(mockRecentSchools);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueChartData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: stats?.revenueHistory || [],
        fill: true,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4
      }
    ]
  };

  const planChartData = {
    labels: ['Trial', 'Basic', 'Standard', 'Premium', 'Enterprise'],
    datasets: [
      {
        data: stats ? Object.values(stats.planDistribution) : [],
        backgroundColor: [
          '#888888',
          '#4facfe',
          '#43e97b',
          '#667eea',
          '#fa709a'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: { color: '#2a2a4a' },
        ticks: { color: '#888' }
      },
      y: {
        grid: { color: '#2a2a4a' },
        ticks: { color: '#888' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#aaa', padding: 20 }
      }
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
          <h1 className="page-title">Platform Dashboard</h1>
          <p className="page-subtitle">Overview of your school management platform</p>
        </div>
        <Link to="/schools" className="btn btn-primary">
          + Add New School
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-label">Total Schools</div>
          <div className="stat-value">{stats.totalSchools}</div>
          <div className="stat-change positive">
            <span>↑</span> {stats.activeSchools} active
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{stats.totalStudents.toLocaleString()}</div>
          <div className="stat-change positive">
            <span>↑</span> Across all schools
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Total Teachers</div>
          <div className="stat-value">{stats.totalTeachers}</div>
          <div className="stat-change positive">
            <span>↑</span> Active educators
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-change positive">
            <span>↑</span> {stats.monthlyGrowth}% growth
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue Trend</h3>
          </div>
          <div style={{ height: '250px' }}>
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Schools by Plan</h3>
          </div>
          <div style={{ height: '250px' }}>
            <Doughnut data={planChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Schools</h3>
          <Link to="/schools" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>School Name</th>
                <th>Plan</th>
                <th>Students</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSchools.map((school) => (
                <tr key={school.id}>
                  <td>
                    <strong>{school.name}</strong>
                  </td>
                  <td>
                    <span className={`badge badge-${getPlanBadge(school.plan)}`}>
                      {school.plan}
                    </span>
                  </td>
                  <td>{school.students}</td>
                  <td>
                    <span className={`badge badge-${school.status === 'active' ? 'success' : 'warning'}`}>
                      {school.status}
                    </span>
                  </td>
                  <td>{new Date(school.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/schools/${school.id}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/schools" className="btn btn-primary">+ Add School</Link>
            <Link to="/users" className="btn btn-secondary">Manage Users</Link>
            <Link to="/billing" className="btn btn-secondary">View Billing</Link>
            <Link to="/storage" className="btn btn-secondary">Check Storage</Link>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>System Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>API Server</span>
              <span className="badge badge-success">Operational</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Database</span>
              <span className="badge badge-success">Healthy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Storage</span>
              <span className="badge badge-info">68% Used</span>
            </div>
          </div>
        </div>
      </div>
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

export default Dashboard;
