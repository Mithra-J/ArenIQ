import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import StatsPanel from "../components/StatsPanel";
import EscalationTimeline from "../components/EscalationTimeline";

function Dashboard() {

  return (

    <div>

      <Navbar />

      <h1>ArenIQ Monitoring Dashboard</h1>

      <StatsPanel />

      <MapView />

      <EscalationTimeline />

    </div>

  );

}

export default Dashboard;