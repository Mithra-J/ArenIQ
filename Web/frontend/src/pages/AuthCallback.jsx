import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusAlert from "../components/StatusAlert";
import { exchangeCodeForSession, getCurrentSession } from "../services/supabaseClient";

function AuthCallback() {
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function finishOAuth() {
      try {
        const hasCode = window.location.search.includes("code=");

        if (hasCode) {
          const { error } = await exchangeCodeForSession(window.location.href);
          if (error) {
            throw error;
          }
        }

        const session = await getCurrentSession();
        if (!mounted) return;

        if (session) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage("Google sign-in completed, but no active session was created.");
        }
      } catch (error) {
        if (!mounted) return;
        setStatus("error");
        setErrorMessage(error.message || "Unable to complete Google sign-in.");
      }
    }

    finishOAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "success") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-sky-900/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
        {status === "loading" ? (
          <LoadingSpinner label="Completing Google sign-in" />
        ) : (
          <StatusAlert title="Google Sign-In Failed" message={errorMessage} tone="error" />
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
