// src/components/staff/dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  LogOut,
  Plus,
  Trash2,
  Filter,
  Download,
  FileText,
  TrendingUp,
} from 'lucide-react';
import type {
  Location,
  Room,
  ProgramType,
  Reservation,
  ReportSummary,
} from '@/types';
import { useToast } from '@/components/ui/toast';

export function StaffDashboard({ session }: { session: Session }) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'reservations' | 'reports'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewReservation, setShowNewReservation] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    programTypeId: '',
  });

  // Form data for new reservation
  const [formData, setFormData] = useState({
    roomId: '',
    programTypeId: '',
    date: '',
    startTime: '',
    endTime: '',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    libraryCardId: '',
    organizationName: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [roomsRes, programTypesRes, reportRes] = await Promise.all([
        fetch(`/api/rooms?locationId=${session.user.locationId}&active=true`),
        fetch('/api/program-types?active=true'),
        fetch('/api/reports?type=summary'),
      ]);

      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRooms(data);
      }

      if (programTypesRes.ok) {
        const data = await programTypesRes.json();
        setProgramTypes(data);
      }

      if (reportRes.ok) {
        const data = await reportRes.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('dateFrom', filters.date);
      if (filters.status) params.append('status', filters.status);
      if (filters.programTypeId) params.append('programTypeId', filters.programTypeId);

      const response = await fetch(`/api/reservations?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          locationId: session.user.locationId,
        }),
      });

      if (response.ok) {
        showSuccess('Reservation created successfully!');
        setShowNewReservation(false);
        setFormData({
          roomId: '',
          programTypeId: '',
          date: '',
          startTime: '',
          endTime: '',
          requesterName: '',
          requesterEmail: '',
          requesterPhone: '',
          libraryCardId: '',
          organizationName: '',
          notes: '',
        });
        fetchReservations();
        fetchData();
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to create reservation');
      }
    } catch {
      showError('An error occurred. Please try again.');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess('Reservation deleted successfully');
        fetchReservations();
        fetchData();
      } else {
        showError('Failed to delete reservation');
      }
    } catch {
      showError('An error occurred. Please try again.');
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/reports?type=export');
      if (response.ok) {
        const data = await response.json();

        // Convert to CSV
        const headers = Object.keys(data[0] || {});
        const csv = [
          headers.join(','),
          ...data.map((row: Record<string, string | number>) =>
            headers.map((header) => `"${row[header] || ''}"`).join(',')
          ),
        ].join('\n');

        // Download
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-600">Manage reservations for your branch</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-600">Staff Member</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
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
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'reservations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reservations
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 sm:px-8 lg:px-16 xl:px-24 py-8">
        {activeTab === 'reservations' && (
          <>
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">All Reservations</h2>
              <button
                onClick={() => setShowNewReservation(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Reservation
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DECLINED">Declined</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Type
                  </label>
                  <select
                    value={filters.programTypeId}
                    onChange={(e) => setFilters({ ...filters, programTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {programTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ date: '', status: '', programTypeId: '' })}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No reservations found
                        </td>
                      </tr>
                    ) : (
                      reservations.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(reservation.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.startTime} - {reservation.endTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.room.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.location.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.requesterName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.requesterEmail}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.requesterPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.programType.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                reservation.status
                              )}`}
                            >
                              {reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteReservation(reservation.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete reservation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reports' && reportData && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.totalReservations}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {reportData.pendingReservations}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.approvedReservations}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Declined</p>
                    <p className="text-2xl font-bold text-red-600">
                      {reportData.declinedReservations}
                    </p>
                  </div>
                  <Filter className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {reportData.cancelledReservations}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Export Reservations
                  </h3>
                  <p className="text-sm text-gray-600">
                    Download all reservation data as CSV file
                  </p>
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* New Reservation Modal */}
      {showNewReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Reservation</h3>
            </div>

            <form onSubmit={handleCreateReservation} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room *
                  </label>
                  <select
                    required
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Type *
                  </label>
                  <select
                    required
                    value={formData.programTypeId}
                    onChange={(e) => setFormData({ ...formData, programTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {programTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.requesterEmail}
                    onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.requesterPhone}
                    onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Library Card ID
                  </label>
                  <input
                    type="text"
                    value={formData.libraryCardId}
                    onChange={(e) => setFormData({ ...formData, libraryCardId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewReservation(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}