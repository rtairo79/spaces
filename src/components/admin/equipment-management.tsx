// src/components/admin/equipment-management.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Equipment {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  active: boolean;
  rooms: Array<{
    room: {
      id: string;
      name: string;
      location: { name: string };
    };
    quantity: number;
  }>;
}

export function EquipmentManagement() {
  const { showSuccess, showError } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess('Equipment added successfully!');
        setShowForm(false);
        setFormData({ name: '', description: '', quantity: 1 });
        fetchEquipment();
      }
    } catch {
      showError('Failed to add equipment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Equipment Management</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item) => (
          <div key={item.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
              </div>
              <span className={`badge ${item.active ? 'badge-success' : 'badge-secondary'}`}>
                {item.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>Total Quantity:</span>
              <span className="font-semibold text-gray-900">{item.quantity}</span>
            </div>

            {item.rooms.length > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Assigned to {item.rooms.length} room(s):
                </div>
                {item.rooms.slice(0, 3).map((assignment) => (
                  <div key={assignment.room.id} className="text-xs text-gray-600 mb-1">
                    • {assignment.room.name} ({assignment.quantity})
                  </div>
                ))}
                {item.rooms.length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    +{item.rooms.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Equipment Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-900">Add New Equipment</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Equipment Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Projector, Whiteboard"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the equipment"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Add Equipment
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
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