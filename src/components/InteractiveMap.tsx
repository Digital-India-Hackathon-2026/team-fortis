import React, { useState, useMemo, useRef, useEffect } from 'react';
import L from 'leaflet';
import { 
  MapPin, Layers, Compass, ZoomIn, ZoomOut, Search, Filter, 
  Info, X, Building2, AlertTriangle, CheckCircle, Activity, ExternalLink
} from 'lucide-react';
import { Complaint, SeverityLevel, ComplaintStatus } from '../types';

interface InteractiveMapProps {
  complaints: Complaint[];
  selectedComplaintId: string | null;
  onSelectComplaint: (id: string) => void;
  interactiveMode: 'view' | 'pin';
  onPinSelect?: (lat: number, lng: number, address: string) => void;
  pinnedLat?: number | null;
  pinnedLng?: number | null;
  height?: string;
  colorBy?: 'category' | 'severity';
}

// Center Coordinates
const TELANGANA_CENTER: [number, number] = [17.8000, 79.1000];
const HYDERABAD_CENTER: [number, number] = [17.3850, 78.4867];

// Helper to get category colors
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Road Infrastructure': return '#f59e0b'; // amber
    case 'Solid Waste & Sanitation': return '#10b981'; // emerald
    case 'Water Supply & Sewerage': return '#3b82f6'; // blue
    case 'Electricity & Streetlights': return '#6366f1'; // indigo
    default: return '#94a3b8'; // slate
  }
};

const getSeverityColor = (severity?: string) => {
  if (!severity) return '#94a3b8'; // slate
  const sev = severity.toUpperCase();
  switch (sev) {
    case 'CRITICAL': return '#ef4444'; // red/rose
    case 'HIGH': return '#f97316'; // orange
    case 'MEDIUM': return '#3b82f6'; // blue
    case 'LOW': return '#10b981'; // green
    default: return '#94a3b8'; // slate
  }
};

const getStatusColor = (status: ComplaintStatus) => {
  switch (status) {
    case 'Pending': return 'bg-amber-500 border-amber-300';
    case 'Verified': return 'bg-blue-500 border-blue-300';
    case 'In Progress': return 'bg-indigo-500 border-indigo-300';
    case 'Resolved': return 'bg-emerald-500 border-emerald-300';
    case 'Rejected': return 'bg-rose-500 border-rose-300';
    default: return 'bg-slate-500 border-slate-300';
  }
};

export default function InteractiveMap({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  interactiveMode = 'view',
  onPinSelect,
  pinnedLat,
  pinnedLng,
  height = 'h-[500px]',
  colorBy = 'category'
}: InteractiveMapProps) {
  const [mapView, setMapView] = useState<'telangana' | 'hyderabad'>('telangana');
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Set default view based on selected/active complaint location
  useEffect(() => {
    if (selectedComplaintId && mapInstanceRef.current) {
      const active = complaints.find(c => c.id === selectedComplaintId);
      if (active && active.latitude && active.longitude) {
        // Hyd center is 17.38, 78.48. If near Hyd, switch to Hyd zoom view
        const isNearHyd = Math.abs(active.latitude - 17.385) < 0.25 && Math.abs(active.longitude - 78.486) < 0.25;
        if (isNearHyd) {
          setMapView('hyderabad');
          mapInstanceRef.current.setView([active.latitude, active.longitude], 13);
        } else {
          setMapView('telangana');
          mapInstanceRef.current.setView([active.latitude, active.longitude], 10);
        }
      }
    }
  }, [selectedComplaintId, complaints]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any old map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCenter = mapView === 'hyderabad' ? HYDERABAD_CENTER : TELANGANA_CENTER;
    const initialZoom = mapView === 'hyderabad' ? 12 : 8;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Add Premium Dark-Themed Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap | CartoDB'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapView]);

  // Filter complaints list
  const plottedComplaints = useMemo(() => {
    return complaints.filter(comp => {
      if (!comp.latitude || !comp.longitude) return false;

      // Filter by category
      if (catFilter !== 'All' && comp.category !== catFilter) return false;

      // Filter by status
      if (statusFilter !== 'All' && comp.status !== statusFilter) return false;

      // Filter by query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesQuery = comp.title.toLowerCase().includes(q) || 
                             comp.description.toLowerCase().includes(q) || 
                             (comp.address || '').toLowerCase().includes(q) ||
                             (comp.complaintId || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [complaints, catFilter, statusFilter, searchQuery]);

  // Synchronize complaints markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    plottedComplaints.forEach(comp => {
      if (!comp.latitude || !comp.longitude) return;
      const isSelected = selectedComplaintId === comp.id;
      const color = colorBy === 'severity' ? getSeverityColor(comp.severity) : getCategoryColor(comp.category);
      const isCritical = comp.severity === 'Critical' || comp.severity === 'High' || comp.severity?.toUpperCase() === 'CRITICAL' || comp.severity?.toUpperCase() === 'HIGH';
      const pulseClass = isCritical ? 'animate-ping' : '';

      // Create clean, gorgeous colored dot markers
      const customIcon = L.divIcon({
        className: 'custom-leaflet-dot-marker',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            ${isCritical ? `<span class="absolute inline-flex h-5 w-5 rounded-full opacity-60 ${pulseClass}" style="background-color: ${color}"></span>` : ''}
            <div class="w-3.5 h-3.5 rounded-full shadow-lg border-2 border-white transition-all duration-200 ${
              isSelected ? 'ring-4 ring-[#6FB555]/50 scale-125' : 'hover:scale-110'
            }" style="background-color: ${color}"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([comp.latitude, comp.longitude], { icon: customIcon }).addTo(map);

      // Add a clean, responsive popup
      const popupContent = `
        <div class="p-2 min-w-[200px] text-[#27322B] bg-white font-sans rounded-xl border border-[#EDF2EA]">
          <div class="flex items-center justify-between gap-1.5 border-b border-[#EDF2EA] pb-1.5 mb-1.5">
            <span class="text-[9px] font-bold text-[#5F6B63] tracking-wider">${comp.complaintId || comp.id.substring(0, 8)}</span>
            <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300">${comp.status}</span>
          </div>
          <h4 class="text-xs font-black text-slate-900 leading-tight mb-1">${comp.title}</h4>
          <p class="text-[10px] text-slate-500 line-clamp-2">${comp.description || ''}</p>
          <p class="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-semibold truncate">📍 ${comp.address || 'Telangana'}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup-container',
        closeButton: false
      });

      marker.on('click', (e) => {
        onSelectComplaint(comp.id);
        L.DomEvent.stopPropagation(e);
      });

      markersRef.current.push(marker);
    });
  }, [plottedComplaints, selectedComplaintId, onSelectComplaint]);

  // Synchronize pinning mode interaction & active pin marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean old pin marker
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }

    // Render active pin
    if (pinnedLat && pinnedLng) {
      const pinIcon = L.divIcon({
        className: 'custom-leaflet-pinned-icon',
        html: `
          <div class="relative flex flex-col items-center justify-center w-10 h-10">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-rose-500/30 opacity-75 animate-ping"></span>
            <svg class="w-8 h-8 text-rose-500 drop-shadow-lg animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 36]
      });

      const pinMarker = L.marker([pinnedLat, pinnedLng], { icon: pinIcon }).addTo(map);
      pinMarkerRef.current = pinMarker;
      
      // Auto-center map on pinned position
      map.setView([pinnedLat, pinnedLng], 14);
    }

    // Map click handler in pinning mode
    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (interactiveMode !== 'pin' || !onPinSelect) return;
      const { lat, lng } = e.latlng;

      setReverseGeocoding(true);
      let resolvedAddress = `Grievance Zone (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        if (response.ok) {
          const data = await response.json();
          resolvedAddress = data.display_name || `${data.name || 'Municipal Sector'}, Telangana`;
        }
      } catch {
        // Fallback default
        resolvedAddress = `Municipal Highway Sector, Telangana`;
      } finally {
        setReverseGeocoding(false);
        onPinSelect(lat, lng, resolvedAddress);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [interactiveMode, onPinSelect, pinnedLat, pinnedLng]);

  // Selected complaint details
  const activeComplaint = useMemo(() => {
    if (!selectedComplaintId) return null;
    return complaints.find(c => c.id === selectedComplaintId) || null;
  }, [selectedComplaintId, complaints]);

  // Direct Zoom Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full w-full">
      {/* MAP CANVAS PANEL */}
      <div className="w-full relative flex flex-col justify-between bg-slate-950 h-full min-h-[400px]">
        
        {/* State Information Header Overlay */}
        <div className="absolute top-4 left-4 z-[400] flex flex-wrap gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-[10px] text-white font-extrabold flex items-center gap-1.5 shadow-lg select-none">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse border border-emerald-400"></span>
            <span className="text-emerald-400 tracking-wider">LIVE MAP</span>
          </div>
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-[10px] text-white font-extrabold flex items-center gap-1.5 shadow-lg">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Leaflet Maps Vector Core</span>
          </div>
          {mapView === 'hyderabad' ? (
            <div className="bg-emerald-950/90 backdrop-blur-md border border-emerald-800/50 px-3 py-1.5 rounded-full text-[10px] text-emerald-400 font-extrabold flex items-center gap-1.5 shadow-lg">
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hyderabad Zone (Detailed GHMC Grid)</span>
            </div>
          ) : (
            <div className="bg-indigo-950/90 backdrop-blur-md border border-indigo-800/50 px-3 py-1.5 rounded-full text-[10px] text-indigo-400 font-extrabold flex items-center gap-1.5 shadow-lg">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Telangana State GIS Grid</span>
            </div>
          )}
        </div>

        {/* Custom Zoom Buttons */}
        <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1">
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center rounded-lg shadow-lg hover:scale-105 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center rounded-lg shadow-lg hover:scale-105 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container Target div */}
        <div 
          ref={mapContainerRef}
          className={`w-full ${height} bg-slate-950 border-b border-slate-800`}
          style={{ zIndex: 1 }}
        />

        {/* REVERSE GEOCODING STATUS SPINNER overlay */}
        {reverseGeocoding && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[500]">
            <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3 max-w-xs">
              <Compass className="w-8 h-8 mx-auto text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-white">Nominatim GIS Mapping...</p>
              <p className="text-[10px] text-slate-400">Reverse geocoding GPS coordinates within Telangana State boundaries.</p>
            </div>
          </div>
        )}

        {/* SELECTED MARKER DETAIL PREVIEW PANEL (Bottom Overlay if clicked) */}
        {interactiveMode === 'view' && activeComplaint && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in z-[400]">
            <div className="flex items-start gap-3 max-w-2xl">
              {activeComplaint.imageUrl ? (
                <img 
                  src={activeComplaint.imageUrl || undefined} 
                  alt="Defect Preview" 
                  className="w-14 h-14 rounded-lg object-cover border border-slate-800 mt-0.5 shrink-0" 
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] bg-slate-800 text-slate-300 font-extrabold px-1.5 py-0.5 rounded">
                    {activeComplaint.complaintId || activeComplaint.id.substring(0, 8)}
                  </span>
                  <span className="text-white font-extrabold text-xs">{activeComplaint.title}</span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeComplaint.severity === 'Critical' || activeComplaint.severity === 'High'
                      ? 'bg-rose-900/50 text-rose-300 border border-rose-800'
                      : 'bg-amber-900/50 text-amber-300 border border-amber-800'
                  }`}>
                    {activeComplaint.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                  {activeComplaint.description}
                </p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {activeComplaint.address || 'Unspecified address location'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
              <span className={`w-3 h-3 rounded-full ${getStatusColor(activeComplaint.status).split(' ')[0]}`} />
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Status</p>
                <p className="text-xs font-bold text-white">{activeComplaint.status}</p>
              </div>
              
              <button 
                onClick={() => {
                  onSelectComplaint(activeComplaint.id);
                  const detailPanel = document.getElementById('complaint-detail-panel');
                  detailPanel?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="ml-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/15 cursor-pointer"
              >
                Inspect Logs
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
