import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getCategories } from '../../services/complaints';
import toast from 'react-hot-toast';
import { MapPin, Image, Trash, AlertTriangle, CheckCircle, UploadCloud } from 'lucide-react';

export default function CreateComplaint() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Location States
  const [latitude, setLatitude] = useState(17.385044); // Default Hyd
  const [longitude, setLongitude] = useState(78.486671);
  const [address, setAddress] = useState('');
  
  // Images
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Duplicates Alert
  const [duplicates, setDuplicates] = useState([]);

  // Fetch Categories
  useEffect(() => {
    const load = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data || response);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    };
    load();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet css dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    import('leaflet').then((L) => {
      if (leafletMap.current) return;

      const map = L.map(mapRef.current).setView([latitude, longitude], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      markerRef.current = marker;
      leafletMap.current = map;

      // Handle marker drag end
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLatitude(pos.lat);
        setLongitude(pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });

      // Handle map click
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      // Try geolocating user
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setLatitude(lat);
          setLongitude(lng);
          map.setView([lat, lng], 15);
          marker.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        });
      } else {
        reverseGeocode(latitude, longitude);
      }
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check for duplicates
  useEffect(() => {
    if (!latitude || !longitude || !categoryId) return;
    
    const check = async () => {
      try {
        const res = await api.get(`/complaints/duplicates/?latitude=${latitude}&longitude=${longitude}&category=${categoryId}`);
        setDuplicates(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    const delay = setTimeout(check, 800);
    return () => clearTimeout(delay);
  }, [latitude, longitude, categoryId]);

  // Handle image upload to Supabase via backend
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/complaints/upload-image/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success && res.data.data?.url) {
          urls.push(res.data.data.url);
        }
      }
      setImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded successfully!`);
    } catch (err) {
      console.error('Image upload error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to upload images.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a grievance title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        category: categoryId,
        latitude: latitude ? Number(parseFloat(latitude).toFixed(6)) : null,
        longitude: longitude ? Number(parseFloat(longitude).toFixed(6)) : null,
        address,
        images
      };

      const res = await api.post('/complaints/', payload);
      if (res.data.success) {
        toast.success('Grievance submitted successfully!');
        navigate('/citizen/dashboard');
      } else {
        toast.error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Complaint submit error:', err.response?.data || err.message);
      const errData = err.response?.data;
      if (errData && errData.errors && Object.keys(errData.errors).length > 0) {
        const errorStrings = Object.entries(errData.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        toast.error(`Error: ${errorStrings}`);
      } else {
        toast.error(errData?.message || 'Failed to submit grievance. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Log a Grievance</h1>
        <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Submit civic complaints to corresponding departments.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Fields */}
        <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Grievance Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken Street Light in Block C"
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context and details here..."
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
            />
          </div>

          {/* Image Uploader */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">Upload Photos</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-all relative">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click or drag images to upload</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP up to 10MB</p>
            </div>

            {/* Thumbnail previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden h-16 border border-slate-200 dark:border-slate-700">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map & Submit */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350">Grievance Location</label>
            <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 z-10" />
            
            <div className="text-xs text-slate-500 flex gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{address || "Locating..."}</span>
            </div>
          </div>

          {/* Duplicate Match Warning */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl space-y-2">
              <div className="flex gap-2 text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm">Similar Issue Logged Near You</h4>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-450 leading-relaxed">
                Another citizen has submitted a similar issue. You can back their issue once registered instead of posting duplicate logs.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full py-3 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
          >
            {submitting ? 'Submitting Grievance...' : 'Submit Grievance'}
          </button>
        </div>
      </form>
    </div>
  );
}
