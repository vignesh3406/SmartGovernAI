import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

export default function NavigationCard({ latitude, longitude, address }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  // Simulated Officer Current Coordinates near the complaint
  const officerLat = parseFloat(latitude) + 0.005;
  const officerLng = parseFloat(longitude) - 0.004;

  useEffect(() => {
    if (!latitude || !longitude || !mapContainerRef.current) return;

    // Load Leaflet css dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet js script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (!window.L) return;

      // Clean up previous map instance
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = window.L.map(mapContainerRef.current).setView([latitude, longitude], 14);
      leafletMapRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add Complaint Marker (Red)
      const complaintIcon = window.L.divIcon({
        className: 'bg-rose-500 w-4 h-4 rounded-full border-2 border-white shadow-md',
        iconSize: [16, 16]
      });
      window.L.marker([latitude, longitude], { icon: complaintIcon })
        .addTo(map)
        .bindPopup('Grievance Site')
        .openPopup();

      // Add Officer Marker (Blue)
      const officerIcon = window.L.divIcon({
        className: 'bg-blue-600 w-4 h-4 rounded-full border-2 border-white shadow-md animate-bounce',
        iconSize: [16, 16]
      });
      window.L.marker([officerLat, officerLng], { icon: officerIcon })
        .addTo(map)
        .bindPopup('Your Current Position');

      // Draw polyline connecting them
      window.L.polyline([[officerLat, officerLng], [latitude, longitude]], {
        color: '#2563eb',
        weight: 3,
        dashArray: '5, 10'
      }).addTo(map);

      // Fit bounds
      map.fitBounds([[officerLat, officerLng], [latitude, longitude]], { padding: [30, 30] });

      // Calculate simple haversine distance
      const R = 6371; // km
      const dLat = (latitude - officerLat) * Math.PI / 180;
      const dLon = (longitude - officerLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(officerLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c; // in km

      setDistance(dist);
      setEta(Math.round(dist * 2.5)); // estimate 2.5 mins per km
    };
    
    document.body.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [latitude, longitude]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" /> Route Navigation
        </h3>
        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 font-bold rounded-md">Live GPS Tracking</span>
      </div>

      <div ref={mapContainerRef} className="w-full h-56 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" />

      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
        <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Distance to Site</div>
          <div className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5 flex items-center gap-1">
            <Compass className="w-4 h-4 text-blue-600" /> {distance.toFixed(2)} km
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Estimated Time (ETA)</div>
          <div className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5">
            ~ {eta} mins
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-450 flex gap-2">
        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
        <span>{address || "Coordinates loaded successfully."}</span>
      </div>
    </div>
  );
}
