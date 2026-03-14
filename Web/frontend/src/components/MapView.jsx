import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function MapView() {

  return (

    <MapContainer
      center={[12.7, 79.98]}
      zoom={11}
      style={{ height: "500px" }}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[12.69, 79.98]}>
        <Popup>
          Encroachment detected
        </Popup>
      </Marker>

    </MapContainer>

  );

}

export default MapView;