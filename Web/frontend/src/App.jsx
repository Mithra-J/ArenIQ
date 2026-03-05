// src/App.jsx  (simplified wrapper for auth + routing)
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  const { session, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h2>Authenticating...</h2>
        <p>Please wait while we check your session.</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Dashboard />
    </>
  );
}

export default App;