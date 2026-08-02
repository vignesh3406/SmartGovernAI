import React, { useState, useEffect } from 'react';
import { getCategories } from '../../services/complaints';
import toast from 'react-hot-toast';

export default function CategoryDropdown({ value, onChange, required = false, className = '' }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategories();
        setCategories(data.data || data);
      } catch (err) {
        toast.error('Failed to load categories.');
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
      <option value="">{loading ? 'Loading categories...' : 'Select Complaint Category'}</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.category_name}
        </option>
      ))}
    </select>
  );
}
