import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { User, Phone, MapPin, Mail, UploadCloud, Trash2, Globe, Clock, Shield } from 'lucide-react';
import ChangePasswordForm from '../components/auth/ChangePasswordForm';

export default function Profile() {
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    bio: '',
    language: 'en',
    timezone: 'UTC',
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/');
      if (response.data.success) {
        const data = response.data.data;
        setProfile(data);
        setFormData({
          fullName: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'India',
          postalCode: data.postal_code || '',
          bio: data.bio || '',
          language: data.language || 'en',
          timezone: data.timezone || 'UTC',
        });
      }
    } catch (error) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await api.put('/profile/', {
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postalCode,
        bio: formData.bio,
        language: formData.language,
        timezone: formData.timezone,
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setProfile(response.data.data);
        await checkAuth(); // Sync user data inside AuthContext
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  // Avatar Upload Handlers
  const uploadFile = async (file) => {
    if (!file) return;

    // Validation checks
    if (!file.type.match('image.*')) {
      toast.error('Only image files (PNG, JPG, GIF) are allowed!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size cannot exceed 2MB!');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const response = await api.patch('/profile/avatar/', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('Avatar uploaded successfully!');
        setProfile(response.data.data);
        await checkAuth();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Avatar upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    setUploading(true);
    try {
      const response = await api.delete('/profile/avatar/');
      if (response.data.success) {
        toast.success('Avatar removed successfully.');
        setProfile(response.data.data);
        await checkAuth();
      }
    } catch (error) {
      toast.error('Failed to remove avatar.');
    } finally {
      setUploading(false);
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
      {/* Profile Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-teal-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-white/50 bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-slate-400" />
              )}
            </div>
            {profile?.profile_picture_url && (
              <button
                onClick={handleDeleteAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-all"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-black">{profile?.full_name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile?.email}</span>
              {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {profile.phone}</span>}
              <span className="flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full capitalize text-xs font-semibold"><Shield className="w-3.5 h-3.5" /> {profile?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Upload Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col justify-center items-center space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Profile Photo</h3>
          
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`w-full max-w-[240px] aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200
              ${dragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept="image/png, image/jpeg, image/gif"
              className="hidden"
            />
            <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
            <p className="text-sm font-semibold text-slate-750 dark:text-slate-200">Drag & drop photo here</p>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">PNG, JPG or GIF up to 2MB</p>
          </div>
          {uploading && <p className="text-sm text-blue-600 animate-pulse">Uploading photo...</p>}
        </div>

        {/* Edit Form Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Profile Settings</h3>
          
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Preferred Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">IST (GMT+5:30)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
              >
                {updating ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
