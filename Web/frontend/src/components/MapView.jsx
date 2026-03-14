import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

function MapView({ center, markers, height = "420px" }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-sky-900/10 bg-white p-3 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)]">
      <MapContainer center={center} zoom={11} style={{ height }} className="z-0 rounded-[20px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={marker.position}
            radius={10}
            pathOptions={{
              color: marker.status === "Critical" ? "#b91c1c" : "#0f766e",
              fillColor: marker.status === "Critical" ? "#ef4444" : "#14b8a6",
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{marker.title}</p>
                <p className="text-sm text-slate-600">{marker.location}</p>
                <p className="text-sm text-slate-600">Status: {marker.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;
