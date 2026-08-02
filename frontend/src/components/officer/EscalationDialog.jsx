import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, X } from 'lucide-react';

export default function EscalationDialog({ complaintId, onClose, onEscalateComplete }) {
  const [departments, setDepartments] = useState([]);
  const [targetDept, setTargetDept] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await api.get('/departments/');
        setDepartments(res.data.data || res.data);
      } catch (err) {
        toast.error('Failed to load departments');
      }
    };
    loadDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetDept || !reason) {
      toast.error('All fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/officer/escalate/', {
        complaint: complaintId,
        reason: reason,
        new_department: targetDept
      });
      if (res.data.success) {
        toast.success('Complaint escalated and rerouted successfully.');
        if (onEscalateComplete) onEscalateComplete();
        onClose();
      }
    } catch (err) {
      toast.error('Escalation routing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Escalate Complaint Assignment</h3>
            <p className="text-xs text-slate-450 mt-0.5">Route assignment to another department for resolution.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
          <div>
            <label className="block text-slate-500 mb-1">Target Department Routing</label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.department_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Escalation Reason Notes</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a detailed explanation of why this assignment is escalated..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {submitting ? 'Escalating...' : 'Escalate Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
