import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/master/StatusBadge';
import PriorityBadge from '../../components/master/PriorityBadge';
import AISummaryCard from '../../components/ai/AISummaryCard';
import AIRecommendationCard from '../../components/ai/AIRecommendationCard';
import NavigationCard from '../../components/officer/NavigationCard';
import EscalationDialog from '../../components/officer/EscalationDialog';
import EvidenceUploadForm from '../../components/officer/EvidenceUploadForm';
import { MapPin, Calendar, User, Building2, CheckCircle2, Star, Eye } from 'lucide-react';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Feedback Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showEscalate, setShowEscalate] = useState(false);

  // Officer Action state
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadDetails = async () => {
    try {
      const res = await api.get(`/complaints/${id}/`);
      setComplaint(res.data.data || res.data);
      
      try {
        const aiRes = await api.get(`/ai/result/${id}/`);
        setAiAnalysis(aiRes.data.data || aiRes.data);
      } catch (aiErr) {
        // No AI analysis found yet
      }
    } catch (err) {
      toast.error('Failed to load complaint details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!complaint || !mapRef.current) return;

    // Load Leaflet css dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    import('leaflet').then((L) => {
      if (leafletMap.current) return;
      const lat = parseFloat(complaint.latitude || 17.385044);
      const lng = parseFloat(complaint.longitude || 78.486671);

      const map = L.map(mapRef.current).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.marker([lat, lng]).addTo(map);
      leafletMap.current = map;
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [complaint]);

  const handleOfficerStatusUpdate = async (statusName) => {
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/officer/status/${id}/`, {
        status: statusName,
        notes: statusNote || `Status updated to ${statusName} by officer.`
      });
      if (res.data.success) {
        toast.success(`Complaint status updated to ${statusName}!`);
        setStatusNote('');
        loadDetails();
      }
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await api.post(`/complaints/${id}/feedback/`, { rating, comment });
      if (res.data.success) {
        toast.success("Feedback submitted. Complaint is now Closed.");
        loadDetails();
      }
    } catch (err) {
      toast.error('Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isCitizenCreator = complaint.citizen_email === currentUser?.email;
  const isOfficerOrAdmin = currentUser?.role?.role_name === 'officer' || currentUser?.role?.role_name === 'admin';
  const showFeedbackForm = isCitizenCreator && complaint.status_detail?.status === 'Resolved';
  const showOfficerActions = isOfficerOrAdmin && ['Pending', 'Submitted', 'Assigned', 'Accepted', 'Travelling', 'Arrived', 'In Progress'].includes(complaint.status_detail?.status);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400">Grievance ID: {complaint.complaint_number}</span>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{complaint.title}</h1>
        </div>
        <div className="flex gap-2.5">
          <StatusBadge status={complaint.status_detail?.status} color={complaint.status_detail?.color} />
          <PriorityBadge priority={complaint.priority_detail?.priority} color={complaint.priority_detail?.color} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Grievance Description</h3>
            <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-line">{complaint.description}</p>

            {/* AISummaryCard */}
            {aiAnalysis && <AISummaryCard analysis={aiAnalysis} />}
          </div>

          {/* EvidenceUploadForm for Officers */}
          {isOfficerOrAdmin && ['Accepted', 'Travelling', 'Arrived', 'In Progress'].includes(complaint.status_detail?.status) && (
            <EvidenceUploadForm complaintId={id} onUploadSuccess={loadDetails} />
          )}

          {/* Image Gallery & Resolution Evidence */}
          {(complaint.images?.length > 0 || complaint.evidence?.length > 0) && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Uploaded Photos & Work Evidence</h3>
                <span className="text-xs font-semibold text-slate-400">
                  {(complaint.images?.length || 0) + (complaint.evidence?.length || 0)} photos attached
                </span>
              </div>

              {/* Officer Work Evidence & Resolution Proof */}
              {complaint.evidence?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Officer Work & Resolution Evidence</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {complaint.evidence.map((ev) => (
                      <div key={ev.id} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src={ev.image_url} alt={ev.evidence_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className={`absolute top-2 left-2 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md ${
                          ev.evidence_type === 'After' || ev.evidence_type === 'Resolution'
                            ? 'bg-emerald-600'
                            : 'bg-blue-600'
                        }`}>
                          {ev.evidence_type} Proof
                        </span>
                        {ev.uploaded_by_name && (
                          <span className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-1 rounded-md truncate">
                            By: {ev.uploaded_by_name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citizen Initial Complaint Photos */}
              {complaint.images?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted Grievance Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {complaint.images.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src={img.image_url} alt="Grievance photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {img.is_resolution && (
                          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">
                            Resolution Proof
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline / Logs */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Timeline Activity</h3>
            <div className="relative border-l-2 border-slate-100 dark:border-slate-850 ml-4 space-y-6">
              {complaint.timeline?.map((step) => (
                <div key={step.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-blue-650 rounded-full border-2 border-white dark:border-slate-800" />
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{step.status_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{step.notes}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{new Date(step.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Metadata details */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Assignment Details</h4>
            
            <div className="space-y-3.5 text-sm text-slate-605">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-450">Department</div>
                  <div className="font-semibold text-slate-800 dark:text-white">{complaint.department_detail?.department_name || 'Pending routing'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-450">Citizen Representative</div>
                  <div className="font-semibold text-slate-800 dark:text-white">{complaint.citizen_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-450">Submitted On</div>
                  <div className="font-semibold text-slate-800 dark:text-white">{new Date(complaint.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AIRecommendationCard */}
          {aiAnalysis && (
            <AIRecommendationCard 
              complaintId={id} 
              analysis={aiAnalysis} 
              onReanalyzeComplete={loadDetails} 
            />
          )}

          {/* Location Map */}
          {isOfficerOrAdmin && ['Accepted', 'Travelling', 'Arrived', 'In Progress'].includes(complaint.status_detail?.status) ? (
            <NavigationCard 
              latitude={complaint.latitude} 
              longitude={complaint.longitude} 
              address={complaint.address} 
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Grievance Coordinate</h4>
              <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" />
              <div className="text-xs text-slate-500 flex gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{complaint.address || "Location detail not available."}</span>
              </div>
            </div>
          )}

          {/* Citizen Feedback Submit */}
          {showFeedbackForm && (
            <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Verify Resolution</h4>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Rate Service Resolution</label>
                  <div className="flex gap-1.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        type="button" 
                        onClick={() => setRating(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : 'text-slate-350'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Add Feedback Comment</label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Confirm and Close Ticket
                </button>
              </form>
            </div>
          )}

          {/* Officer Dashboard updates */}
          {showOfficerActions && (
            <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Officer Work Actions</h4>
              
              <div className="space-y-3">
                <textarea
                  rows={2}
                  placeholder="Officer workflow notes..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  {complaint.status_detail?.status === 'Pending' && (
                    <button 
                      onClick={() => handleOfficerStatusUpdate('Accepted')}
                      disabled={updatingStatus}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      Accept Assignment
                    </button>
                  )}
                  {complaint.status_detail?.status === 'Accepted' && (
                    <button 
                      onClick={() => handleOfficerStatusUpdate('Travelling')}
                      disabled={updatingStatus}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      Start Travelling
                    </button>
                  )}
                  {complaint.status_detail?.status === 'Travelling' && (
                    <button 
                      onClick={() => handleOfficerStatusUpdate('Arrived')}
                      disabled={updatingStatus}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      Arrive at Site
                    </button>
                  )}
                  {complaint.status_detail?.status === 'Arrived' && (
                    <button 
                      onClick={() => handleOfficerStatusUpdate('In Progress')}
                      disabled={updatingStatus}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      Begin Resolution Work
                    </button>
                  )}
                  
                  {['Accepted', 'Travelling', 'Arrived', 'In Progress'].includes(complaint.status_detail?.status) && (
                    <button 
                      onClick={() => setShowEscalate(true)}
                      disabled={updatingStatus}
                      className="py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      Escalate/Reroute
                    </button>
                  )}
                </div>
                
                {['Accepted', 'Travelling', 'Arrived', 'In Progress'].includes(complaint.status_detail?.status) && (
                  <button
                    onClick={() => handleOfficerStatusUpdate('Resolved')}
                    disabled={updatingStatus}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Work Completed (Mark Issue Resolved)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEscalate && (
        <EscalationDialog 
          complaintId={id} 
          onClose={() => setShowEscalate(false)} 
          onEscalateComplete={loadDetails} 
        />
      )}
    </div>
  );
}
