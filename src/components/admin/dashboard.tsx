// src/components/admin/dashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { EquipmentManagement } from '@/components/admin/equipment-management';
import { EmailTemplatesManagement } from '@/components/admin/email-templates';
import {
  Calendar,
  Check,
  X,
  Trash2,
  Settings,
  BarChart3,
  Users,
  Clock,
  Download,
  Filter,
  LogOut,
  Building2,
} from 'lucide-react';
import type {
  Location,
  ProgramType,
  Reservation,
  ReportSummary,
  ReportData,
} from '@/types';
import { useToast } from '@/components/ui/toast';

export function AdminDashboard({ session }: { session: Session }) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'reservations' | 'config' | 'reports'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [filters, setFilters] = useState({
    locationId: '',
    date: '',
    status: '',
    programTypeId: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [locationsRes, programTypesRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/program-types'),
      ]);

      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (programTypesRes.ok) setProgramTypes(await programTypesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('locationId', filters.locationId);
      if (filters.date) params.append('dateFrom', filters.date);
      if (filters.status) params.append('status', filters.status);
      if (filters.programTypeId) params.append('programTypeId', filters.programTypeId);

      const response = await fetch(`/api/reservations?${params.toString()}`);
      if (response.ok) setReservations(await response.json());
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }, [filters]);

  const fetchReports = useCallback(async () => {
    try {
      const [summaryRes, byLocationRes, byProgramRes] = await Promise.all([
        fetch('/api/reports?type=summary'),
        fetch('/api/reports?type=by-location'),
        fetch('/api/reports?type=by-program-type'),
      ]);

      const summary = summaryRes.ok ? await summaryRes.json() : null;
      const byLocation = byLocationRes.ok ? await byLocationRes.json() : [];
      const byProgram = byProgramRes.ok ? await byProgramRes.json() : [];

      setReportData({ summary, byLocation, byProgram });
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, fetchReservations, fetchReports]);

  const updateReservationStatus = async (id: string, status: 'APPROVED' | 'DECLINED') => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        showSuccess(`Reservation ${status.toLowerCase()} successfully!`);
        fetchReservations();
      }
    } catch {
      showError('An error occurred');
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showSuccess('Reservation deleted successfully');
        fetchReservations();
      }
    } catch {
      showError('Failed to delete reservation');
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/reports?type=export');
      if (response.ok) {
        const data = await response.json();
        const headers = Object.keys(data[0] || {});
        const csv = [
          headers.join(','),
          ...data.map((row: Record<string, string | number>) =>
            headers.map((header) => `"${row[header] || ''}"`).join(',')
          ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch {
      showError('Failed to export data');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'badge badge-warning',
      APPROVED: 'badge badge-success',
      DECLINED: 'badge badge-danger',
      CANCELLED: 'badge badge-secondary',
    };
    return styles[status as keyof typeof styles] || 'badge badge-secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 sm:px-8 lg:px-16 xl:px-24 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage reservations and settings</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Administrator
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="btn btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 sm:px-8 lg:px-16 xl:px-24">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`nav-tab ${activeTab === 'reservations' ? 'active' : ''}`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Reservations
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`nav-tab ${activeTab === 'config' ? 'active' : ''}`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 sm:px-8 lg:px-16 xl:px-24 py-8">
        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-label">Total Reservations</div>
                    <div className="stat-value">{reservations.length}</div>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-label">Pending</div>
                    <div className="stat-value text-yellow-600">
                      {reservations.filter(r => r.status === 'PENDING').length}
                    </div>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-label">Approved</div>
                    <div className="stat-value text-green-600">
                      {reservations.filter(r => r.status === 'APPROVED').length}
                    </div>
                  </div>
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-label">Declined</div>
                    <div className="stat-value text-red-600">
                      {reservations.filter(r => r.status === 'DECLINED').length}
                    </div>
                  </div>
                  <X className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filter Reservations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Location</label>
                  <select
                    value={filters.locationId}
                    onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                    className="input"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DECLINED">Declined</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Program Type</label>
                  <select
                    value={filters.programTypeId}
                    onChange={(e) => setFilters({ ...filters, programTypeId: e.target.value })}
                    className="input"
                  >
                    <option value="">All Types</option>
                    {programTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label invisible">Clear</label>
                  <button
                    onClick={() => setFilters({ locationId: '', date: '', status: '', programTypeId: '' })}
                    className="btn btn-secondary w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Room</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <Calendar className="empty-state-icon" />
                          <div className="empty-state-title">No reservations found</div>
                          <div className="empty-state-description">
                            Try adjusting your filters or check back later
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res.id}>
                        <td>
                          <div className="font-medium text-gray-900">{res.requesterName}</div>
                          <div className="text-sm text-gray-500">{res.requesterEmail}</div>
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{res.room.name}</div>
                          <div className="text-sm text-gray-500">{res.location.name}</div>
                        </td>
                        <td className="font-medium text-gray-900">
                          {new Date(res.date).toLocaleDateString()}
                        </td>
                        <td className="text-gray-900">
                          {res.startTime} - {res.endTime}
                        </td>
                        <td>
                          <span className={getStatusBadge(res.status)}>
                            {res.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {res.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => updateReservationStatus(res.id, 'APPROVED')}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateReservationStatus(res.id, 'DECLINED')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                  title="Decline"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteReservation(res.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">System Configuration</h2>
            <EquipmentManagement />
            <EmailTemplatesManagement />
            
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Locations</h3>
              </div>
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{loc.name}</div>
                      <div className="text-sm text-gray-500">{loc.address}</div>
                    </div>
                    <span className={`badge ${loc.active ? 'badge-success' : 'badge-secondary'}`}>
                      {loc.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Meeting Room Policy</h3>
              <textarea
                className="input"
                rows={10}
                placeholder="Enter meeting room policy..."
                defaultValue="Please follow all library rules and regulations..."
              />
              <div className="mt-4">
                <button className="btn btn-primary">Update Policy</button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
              <button onClick={exportToCSV} className="btn btn-success">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>

            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="stat-card">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{reportData.summary.totalReservations}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value text-yellow-600">{reportData.summary.pendingReservations}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Approved</div>
                  <div className="stat-value text-green-600">{reportData.summary.approvedReservations}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Declined</div>
                  <div className="stat-value text-red-600">{reportData.summary.declinedReservations}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Rooms</div>
                  <div className="stat-value text-blue-600">{reportData.summary.activeRooms}</div>
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Reservations by Location</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Total</th>
                      <th>Pending</th>
                      <th>Approved</th>
                      <th>Declined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.byLocation.map((item, index) => (
                      <tr key={index}>
                        <td className="font-medium">{item.location}</td>
                        <td>{item.total}</td>
                        <td className="text-yellow-600">{item.pending}</td>
                        <td className="text-green-600">{item.approved}</td>
                        <td className="text-red-600">{item.declined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


// Removed stray top-level helper stubs that conflicted with component-scoped implementations.