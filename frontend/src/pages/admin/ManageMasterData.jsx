import React, { useState, useEffect } from 'react';
import { 
  getCategories, getDepartments, getStatuses, getPriorities,
  createDepartment, updateDepartment, deleteDepartment,
  createCategory, updateCategory, deleteCategory,
  createStatus, updateStatus, deleteStatus,
  createPriority, updatePriority, deletePriority
} from '../../services/complaints';
import toast from 'react-hot-toast';
import { Settings, Folder, Shield, Sliders, Edit3, Trash2, Plus } from 'lucide-react';

export default function ManageMasterData() {
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);

  // Lists State
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);

  // Form Editing State
  const [editingId, setEditingId] = useState(null);
  const [formType, setFormType] = useState('create'); // 'create' or 'edit'
  
  // Forms states
  const [deptForm, setDeptForm] = useState({ name: '', description: '', email: '', phone: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: '', color: '#3b82f6', departmentId: '' });
  const [statusForm, setStatusForm] = useState({ name: '', description: '', color: '#3b82f6', sequence: 0 });
  const [prioForm, setPrioForm] = useState({ name: '', weight: 0, color: '#3b82f6' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, cats, stats, prios] = await Promise.all([
        getDepartments(),
        getCategories(),
        getStatuses(),
        getPriorities()
      ]);
      setDepartments(depts.data || depts);
      setCategories(cats.data || cats);
      setStatuses(stats.data || stats);
      setPriorities(prios.data || prios);
    } catch (err) {
      toast.error('Failed to load master configuration lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForms = () => {
    setEditingId(null);
    setFormType('create');
    setDeptForm({ name: '', description: '', email: '', phone: '' });
    setCatForm({ name: '', description: '', icon: '', color: '#3b82f6', departmentId: '' });
    setStatusForm({ name: '', description: '', color: '#3b82f6', sequence: 0 });
    setPrioForm({ name: '', weight: 0, color: '#3b82f6' });
  };

  // CRUD handlers for Departments
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        department_name: deptForm.name,
        description: deptForm.description,
        department_email: deptForm.email,
        department_phone: deptForm.phone
      };

      if (formType === 'create') {
        await createDepartment(payload);
        toast.success('Department created!');
      } else {
        await updateDepartment(editingId, payload);
        toast.success('Department updated!');
      }
      resetForms();
      loadData();
    } catch (err) {
      toast.error('Failed to save department.');
    }
  };

  const handleEditDept = (dept) => {
    setEditingId(dept.id);
    setFormType('edit');
    setDeptForm({
      name: dept.department_name,
      description: dept.description || '',
      email: dept.department_email || '',
      phone: dept.department_phone || ''
    });
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success('Department deleted!');
      loadData();
    } catch (err) {
      toast.error('Cannot delete: Category might be referenced.');
    }
  };

  // CRUD handlers for Categories
  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category_name: catForm.name,
        description: catForm.description,
        icon: catForm.icon,
        color: catForm.color,
        department: catForm.departmentId
      };

      if (formType === 'create') {
        await createCategory(payload);
        toast.success('Category created!');
      } else {
        await updateCategory(editingId, payload);
        toast.success('Category updated!');
      }
      resetForms();
      loadData();
    } catch (err) {
      toast.error('Failed to save category.');
    }
  };

  const handleEditCat = (cat) => {
    setEditingId(cat.id);
    setFormType('edit');
    setCatForm({
      name: cat.category_name,
      description: cat.description || '',
      icon: cat.icon || '',
      color: cat.color || '#3b82f6',
      departmentId: cat.department || ''
    });
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted!');
      loadData();
    } catch (err) {
      toast.error('Failed to delete category.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Master Configuration Console</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setActiveTab('departments'); resetForms(); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all
            ${activeTab === 'departments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}
          `}
        >
          <Folder className="w-4 h-4" /> Departments
        </button>
        <button
          onClick={() => { setActiveTab('categories'); resetForms(); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all
            ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}
          `}
        >
          <Sliders className="w-4 h-4" /> Categories
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dynamic List Container */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">{activeTab} List</h3>
          
          {activeTab === 'departments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-3">Name</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-semibold">{dept.department_name}</td>
                      <td className="py-3">{dept.department_email || '-'}</td>
                      <td className="py-3 flex gap-2">
                        <button onClick={() => handleEditDept(dept)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteDept(dept.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-3">Category</th>
                    <th className="py-3">Dept</th>
                    <th className="py-3">Color</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-semibold">{cat.category_name}</td>
                      <td className="py-3">{cat.department_name}</td>
                      <td className="py-3">
                        <span style={{ backgroundColor: cat.color }} className="inline-block w-4 h-4 rounded-full border border-white/50" />
                      </td>
                      <td className="py-3 flex gap-2">
                        <button onClick={() => handleEditCat(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCat(cat.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Form Editor */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 capitalize">{formType} {activeTab.slice(0, -1)}</h3>
          
          {activeTab === 'departments' && (
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Name</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Description</label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Email</label>
                <input
                  type="email"
                  value={deptForm.email}
                  onChange={(e) => setDeptForm({ ...deptForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Phone</label>
                <input
                  type="text"
                  value={deptForm.phone}
                  onChange={(e) => setDeptForm({ ...deptForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Save</button>
                {formType === 'edit' && <button type="button" onClick={resetForms} className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl">Cancel</button>}
              </div>
            </form>
          )}

          {activeTab === 'categories' && (
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Name</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Department</label>
                <select
                  value={catForm.departmentId}
                  onChange={(e) => setCatForm({ ...catForm, departmentId: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Color Theme</label>
                <input
                  type="color"
                  value={catForm.color}
                  onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">Icon Name</label>
                <input
                  type="text"
                  value={catForm.icon}
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                  placeholder="e.g. Trash2, Droplet"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Save</button>
                {formType === 'edit' && <button type="button" onClick={resetForms} className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl">Cancel</button>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
