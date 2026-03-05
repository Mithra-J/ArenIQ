// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your email');
      setMessageType('error');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const { error } = await signInWithEmail(email);

      if (error) {
        // Common Supabase errors
        let friendlyMsg = error.message;
        if (error.message.includes('rate limit')) {
          friendlyMsg = 'Too many attempts. Please wait a minute and try again.';
        } else if (error.message.includes('not confirmed')) {
          friendlyMsg = 'This email needs to be confirmed first.';
        }

        setMessage(friendlyMsg);
        setMessageType('error');
      } else {
        setMessage('Magic link sent! Check your inbox (and spam folder).');
        setMessageType('success');
      }
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!email || !validateEmail(email)) return;
    handleSubmit({ preventDefault: () => {} }); // simulate submit
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        padding: '32px 28px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1a365d' }}>
            ArenIQ Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Waterbody Encroachment Monitoring
          </p>
        </div>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Sign In</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          Use magic link — no password required
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}
            >
              Official Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@tn.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#93c5fd' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1.05rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '6px',
              background: messageType === 'success' ? '#ecfdf5' : '#fef2f2',
              color: messageType === 'success' ? '#065f46' : '#991b1b',
              textAlign: 'center',
            }}
          >
            {message}
          </p>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
          {email && validateEmail(email) && !loading && (
            <button
              type="button"
              onClick={handleResend}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Resend magic link
            </button>
          )}
          <p style={{ marginTop: '12px' }}>
            Contact support if you don’t receive the email within 2 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}