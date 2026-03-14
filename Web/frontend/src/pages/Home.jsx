import Navbar from "../components/Navbar";
import SatellitePreview from "../components/SatellitePreview";

function Home() {

  return (
    <div>

      <Navbar />

      <section className="hero">

        <h1>ArenIQ</h1>

        <p>
          Waterbody Encroachment Monitoring System
        </p>

      </section>

      <section className="about">

        <h2>About ArenIQ</h2>

        <p>
          ArenIQ monitors waterbodies using Sentinel-2 satellite imagery
          and allows citizens to report encroachments with GPS.
        </p>

      </section>

      <SatellitePreview />

    </div>
  );
}

export default Home;