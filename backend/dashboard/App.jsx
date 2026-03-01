import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/reports")
      .then(res => setReports(res.data));
  }, []);

  return (
    <div>
      <h1>AREN IQ Dashboard</h1>
      {reports.map((r, i) => (
        <div key={i}>
          <p>{r.description}</p>
        </div>
      ))}
    </div>
  );
}

export default App;