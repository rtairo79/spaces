'use client';

import { useState, useEffect } from 'react';
import { Mail, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  active: boolean;
}

export function EmailTemplatesManagement() {
  const { showSuccess, showError } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });

      if (response.ok) {
        showSuccess('Template saved successfully!');
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch {
      showError('Failed to save template');
    }
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          active: !template.active,
        }),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch {
      showError('Failed to toggle template');
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
      <div className="flex items-center gap-2">
        <Mail className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
      </div>

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Key: {template.key}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(template)}
                  className={`badge cursor-pointer ${
                    template.active ? 'badge-success' : 'badge-secondary'
                  }`}
                >
                  {template.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Subject:</span>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Available Variables:</span>
                <p className="text-xs text-gray-500 mt-1">
                  {'{'}{'{'} name {'}'}{'}'}, {'{'}{'{'} room {'}'}{'}'}, {'{'}{'{'} date {'}'}{'}'}, {'{'}{'{'} time {'}'}{'}'}, {'{'}{'{'} location {'}'}{'}'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Email Template: {editingTemplate.name}
              </h3>
            </div>

            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="form-label">Subject Line</label>
                <input
                  type="text"
                  className="input"
                  value={editingTemplate.subject}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                  }
                />
                <p className="form-help">
                  Use variables: {'{'}{'{'} name {'}'}{'}'}, {'{'}{'{'} room {'}'}{'}'}, {'{'}{'{'} date {'}'}{'}'}, etc.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Email Body (HTML)</label>
                <textarea
                  className="input font-mono text-sm"
                  rows={15}
                  value={editingTemplate.body}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, body: e.target.value })
                  }
                />
                <p className="form-help">
                  HTML is supported. Use variables like {'{'}{'{'} name {'}'}{'}'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingTemplate.active}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, active: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Template Active
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleSave} className="btn btn-primary">
                <Check className="w-4 h-4 mr-2" />
                Save Template
              </button>
              <button
                onClick={() => setEditingTemplate(null)}
                className="btn btn-secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}