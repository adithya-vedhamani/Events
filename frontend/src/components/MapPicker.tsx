import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapPickerProps {
  value?: [number, number];
  onChange?: (coords: [number, number]) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(value || [12.9716, 77.5946]); // Default: Bangalore
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (value && (value[0] !== position[0] || value[1] !== position[1])) {
      setPosition(value);
      if (mapRef.current) {
        mapRef.current.setView(value, mapRef.current.getZoom());
      }
    }
  }, [value]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onChange && onChange([e.latlng.lat, e.latlng.lng]);
      },
    });
    return <Marker position={position} />;
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: 300, width: '100%' }}
      scrollWheelZoom={true}
      whenCreated={mapInstance => {
        mapRef.current = mapInstance;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <LocationMarker />
    </MapContainer>
  );
} 