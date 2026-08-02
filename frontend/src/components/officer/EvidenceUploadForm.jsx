import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Camera, Upload, Trash2 } from 'lucide-react';

export default function EvidenceUploadForm({ complaintId, onUploadSuccess }) {
  const [evidenceType, setEvidenceType] = useState('Before');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct mock upload or Supabase upload simulation
      const res = await api.post('/complaints/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setPreviewUrl(res.data.data.url || res.data.data);
        toast.success('Image uploaded successfully!');
      }
    } catch (err) {
      toast.error('Image upload failed. Using local preview url.');
      // Fallback preview
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewUrl) {
      toast.error('Please upload an image first.');
      return;
    }

    try {
      const res = await api.post('/officer/upload-evidence/', {
        complaint: complaintId,
        image_url: previewUrl,
        evidence_type: evidenceType,
        description: description
      });
      if (res.data.success) {
        toast.success('Work evidence logged successfully!');
        setPreviewUrl('');
        setDescription('');
        if (onUploadSuccess) onUploadSuccess();
      }
    } catch (err) {
      toast.error('Failed to log work evidence.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4 font-semibold text-xs text-slate-600">
      <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-600" /> Log Work Evidence
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-500 mb-1">Evidence Type</label>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="Before">Before Image</option>
            <option value="After">After Image (Resolution)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 mb-1">Description Note</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Cleared pothole area..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-500 mb-2">Upload Photo Proof</label>
        
        {previewUrl ? (
          <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-750">
            <img src={previewUrl} alt="evidence preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPreviewUrl('')}
              className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white p-2 rounded-lg hover:scale-105 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="w-full h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl flex flex-col justify-center items-center cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
            <span className="text-[10px] text-slate-400">
              {uploading ? 'Uploading image...' : 'Click to select and upload evidence image'}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={uploading || !previewUrl}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
      >
        Save Evidence Log
      </button>
    </form>
  );
}
