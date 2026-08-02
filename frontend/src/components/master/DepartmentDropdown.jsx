import React, { useState, useEffect } from 'react';
import { getDepartments } from '../../services/complaints';
import toast from 'react-hot-toast';

export default function DepartmentDropdown({ value, onChange, required = false, className = '' }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data.data || data);
      } catch (err) {
        toast.error('Failed to load departments.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={loading}
      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${className}`}
    >
      <option value="">{loading ? 'Loading departments...' : 'Select Department'}</option>
      {departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.department_name}
        </option>
      ))}
    </select>
  );
}
