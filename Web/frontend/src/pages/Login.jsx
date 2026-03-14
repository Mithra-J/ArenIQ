import { supabase } from "../services/supabaseClient";

function Login() {

  const loginWithGoogle = async () => {

    await supabase.auth.signInWithOAuth({
      provider: "google"
    });

  };

  return (

    <div className="login">

      <h2>Login</h2>

      <button onClick={loginWithGoogle}>
        Sign in with Google
      </button>

    </div>

  );
}

export default Login;