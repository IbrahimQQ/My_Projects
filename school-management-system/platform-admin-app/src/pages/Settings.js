import React, { useState } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    platformName: 'SchoolSaaS',
    supportEmail: 'support@schoolsaas.com',
    defaultCurrency: 'USD',
    timezone: 'America/New_York',
    maintenanceMode: false,
    allowRegistration: true,
    trialDays: 30,
    defaultPlan: 'trial',
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    smtpPassword: '••••••••••••••••',
    fromEmail: 'noreply@schoolsaas.com',
    fromName: 'SchoolSaaS',
    backupFrequency: 'daily',
    backupRetention: 30,
    autoBackup: true,
    maxFileSize: 50, // MB
    allowedFileTypes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,png,gif'
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Configure global platform settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          Settings saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Email
        </button>
        <button
          className={`tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          Backup
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          Plans
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '24px' }}>General Settings</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Platform Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Support Email</label>
              <input
                type="email"
                className="form-input"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select
                className="form-select"
                value={settings.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Chicago">Central Time (US)</option>
                <option value="America/Denver">Mountain Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="Europe/London">London (GMT)</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Trial Period (Days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.trialDays}
                onChange={(e) => handleChange('trialDays', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Plan</label>
              <select
                className="form-select"
                value={settings.defaultPlan}
                onChange={(e) => handleChange('defaultPlan', e.target.value)}
              >
                <option value="trial">Trial</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
              <span>Maintenance Mode</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
              />
              <span>Allow New Registrations</span>
            </label>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '24px' }}>Email Settings</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                className="form-input"
                value={settings.smtpHost}
                onChange={(e) => handleChange('smtpHost', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input
                type="number"
                className="form-input"
                value={settings.smtpPort}
                onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">SMTP Username</label>
              <input
                type="text"
                className="form-input"
                value={settings.smtpUser}
                onChange={(e) => handleChange('smtpUser', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password</label>
              <input
                type="password"
                className="form-input"
                value={settings.smtpPassword}
                onChange={(e) => handleChange('smtpPassword', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">From Email</label>
              <input
                type="email"
                className="form-input"
                value={settings.fromEmail}
                onChange={(e) => handleChange('fromEmail', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">From Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.fromName}
                onChange={(e) => handleChange('fromName', e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: '16px' }}>
            Send Test Email
          </button>
        </div>
      )}

      {/* Backup Settings */}
      {activeTab === 'backup' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '24px' }}>Backup Settings</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Backup Frequency</label>
              <select
                className="form-select"
                value={settings.backupFrequency}
                onChange={(e) => handleChange('backupFrequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Retention Period (Days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.backupRetention}
                onChange={(e) => handleChange('backupRetention', parseInt(e.target.value))}
              />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => handleChange('autoBackup', e.target.checked)}
            />
            <span>Enable Automatic Backups</span>
          </label>
          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-primary">
              Create Manual Backup Now
            </button>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '24px' }}>Security Settings</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Max File Upload Size (MB)</label>
              <input
                type="number"
                className="form-input"
                value={settings.maxFileSize}
                onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Allowed File Types</label>
              <input
                type="text"
                className="form-input"
                value={settings.allowedFileTypes}
                onChange={(e) => handleChange('allowedFileTypes', e.target.value)}
                placeholder="pdf,doc,docx,jpg,png"
              />
            </div>
          </div>
          <div style={{ marginTop: '24px', padding: '16px', background: '#16162a', borderRadius: '8px' }}>
            <h4 style={{ color: '#fff', marginBottom: '12px' }}>Security Actions</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary">Force All Users Logout</button>
              <button className="btn btn-secondary">Invalidate All Sessions</button>
              <button className="btn btn-danger">Reset All Passwords</button>
            </div>
          </div>
        </div>
      )}

      {/* Plans Settings */}
      {activeTab === 'plans' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '24px' }}>Subscription Plans</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price/Month</th>
                  <th>Max Students</th>
                  <th>Max Teachers</th>
                  <th>Storage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge badge-warning">Trial</span></td>
                  <td>$0</td>
                  <td>100</td>
                  <td>20</td>
                  <td>5 GB</td>
                  <td><button className="btn btn-secondary btn-sm">Edit</button></td>
                </tr>
                <tr>
                  <td><span className="badge badge-info">Basic</span></td>
                  <td>$99</td>
                  <td>300</td>
                  <td>30</td>
                  <td>20 GB</td>
                  <td><button className="btn btn-secondary btn-sm">Edit</button></td>
                </tr>
                <tr>
                  <td><span className="badge badge-success">Standard</span></td>
                  <td>$199</td>
                  <td>500</td>
                  <td>50</td>
                  <td>50 GB</td>
                  <td><button className="btn btn-secondary btn-sm">Edit</button></td>
                </tr>
                <tr>
                  <td><span className="badge badge-purple">Premium</span></td>
                  <td>$399</td>
                  <td>1000</td>
                  <td>100</td>
                  <td>100 GB</td>
                  <td><button className="btn btn-secondary btn-sm">Edit</button></td>
                </tr>
                <tr>
                  <td><span className="badge badge-danger">Enterprise</span></td>
                  <td>$799</td>
                  <td>5000</td>
                  <td>500</td>
                  <td>500 GB</td>
                  <td><button className="btn btn-secondary btn-sm">Edit</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
