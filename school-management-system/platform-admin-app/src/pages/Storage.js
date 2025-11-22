import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';

const Storage = () => {
  const [storageData, setStorageData] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const mockStorageData = {
        totalCapacity: 500, // GB
        usedStorage: 156.8,
        availableStorage: 343.2,
        breakdown: {
          documents: 45.2,
          images: 32.5,
          videos: 58.1,
          backups: 15.0,
          other: 6.0
        }
      };

      const mockSchools = [
        { id: '1', name: 'Lincoln High School', storage: 25.5, limit: 50, students: 850, files: 12500 },
        { id: '2', name: 'Washington Academy', storage: 18.2, limit: 30, students: 420, files: 8900 },
        { id: '3', name: 'Jefferson Elementary', storage: 12.8, limit: 20, students: 280, files: 5600 },
        { id: '4', name: 'Kennedy Preparatory', storage: 45.3, limit: 100, students: 1450, files: 28000 },
        { id: '5', name: 'Roosevelt Middle School', storage: 8.5, limit: 15, students: 75, files: 3200 },
        { id: '6', name: 'Adams High School', storage: 22.1, limit: 30, students: 620, files: 9800 },
        { id: '7', name: 'Monroe Elementary', storage: 10.4, limit: 20, students: 310, files: 4500 },
        { id: '8', name: 'Madison Prep', storage: 14.0, limit: 30, students: 380, files: 6100 }
      ];

      setStorageData(mockStorageData);
      setSchools(mockSchools);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const breakdownChartData = {
    labels: ['Documents', 'Images', 'Videos', 'Backups', 'Other'],
    datasets: [
      {
        data: storageData ? Object.values(storageData.breakdown) : [],
        backgroundColor: [
          '#667eea',
          '#4facfe',
          '#43e97b',
          '#fa709a',
          '#888888'
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
        position: 'right',
        labels: { color: '#aaa', padding: 15 }
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
          <h1 className="page-title">Storage Management</h1>
          <p className="page-subtitle">Monitor and manage storage across all schools</p>
        </div>
        <button className="btn btn-primary">
          Create Backup
        </button>
      </div>

      {/* Overall Storage Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-label">Total Capacity</div>
          <div className="stat-value">{storageData.totalCapacity} GB</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Used Storage</div>
          <div className="stat-value">{storageData.usedStorage} GB</div>
          <div className="stat-change">
            {((storageData.usedStorage / storageData.totalCapacity) * 100).toFixed(1)}% used
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Available</div>
          <div className="stat-value">{storageData.availableStorage} GB</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Total Files</div>
          <div className="stat-value">{schools.reduce((a, s) => a + s.files, 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Overall Storage Usage</h3>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Used: {storageData.usedStorage} GB</span>
              <span>Total: {storageData.totalCapacity} GB</span>
            </div>
            <div className="progress-bar" style={{ height: '24px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${(storageData.usedStorage / storageData.totalCapacity) * 100}%`,
                  background: getStorageColor((storageData.usedStorage / storageData.totalCapacity) * 100)
                }}
              ></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
            <span>
              {((storageData.usedStorage / storageData.totalCapacity) * 100).toFixed(1)}% used
            </span>
            <span>
              {storageData.availableStorage} GB available
            </span>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Storage Breakdown</h3>
          <div style={{ height: '200px' }}>
            <Doughnut data={breakdownChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Storage by School */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Storage by School</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>School</th>
                <th>Students</th>
                <th>Files</th>
                <th>Storage Used</th>
                <th>Limit</th>
                <th>Usage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.sort((a, b) => b.storage - a.storage).map((school) => {
                const usagePercent = (school.storage / school.limit) * 100;
                return (
                  <tr key={school.id}>
                    <td><strong>{school.name}</strong></td>
                    <td>{school.students}</td>
                    <td>{school.files.toLocaleString()}</td>
                    <td>{school.storage} GB</td>
                    <td>{school.limit} GB</td>
                    <td style={{ width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${usagePercent}%`,
                              background: getStorageColor(usagePercent)
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#888', width: '40px' }}>
                          {usagePercent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm">
                          Details
                        </button>
                        <button className="btn btn-secondary btn-sm">
                          Increase
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Alerts */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Storage Alerts</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {schools.filter(s => (s.storage / s.limit) * 100 > 80).length > 0 ? (
            schools
              .filter(s => (s.storage / s.limit) * 100 > 80)
              .map((school) => (
                <div
                  key={school.id}
                  className="alert alert-error"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong>{school.name}</strong> is using {((school.storage / school.limit) * 100).toFixed(0)}% of storage
                    <span style={{ marginLeft: '12px', fontSize: '12px' }}>
                      ({school.storage} GB / {school.limit} GB)
                    </span>
                  </div>
                  <button className="btn btn-secondary btn-sm">
                    Increase Limit
                  </button>
                </div>
              ))
          ) : (
            <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>
              No storage alerts at this time
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStorageColor = (percent) => {
  if (percent < 60) return 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)';
  if (percent < 80) return 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)';
  return 'linear-gradient(90deg, #f5576c 0%, #f093fb 100%)';
};

export default Storage;
