import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Reports from "./pages/Reports";
import AdminPanel from "./pages/AdminPanel";
import SatelliteMonitoring from "./pages/SatelliteMonitoring";

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicLayout>
              <Signup />
            </PublicLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PortalLayout>
              <Dashboard />
            </PortalLayout>
          }
        />
        <Route
          path="/monitoring"
          element={
            <PortalLayout>
              <SatelliteMonitoring />
            </PortalLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <PortalLayout>
              <Reports />
            </PortalLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <PortalLayout>
              <AdminPanel />
            </PortalLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
