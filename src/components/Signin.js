import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { FaEye, FaEyeSlash }                     from 'react-icons/fa';
import { auth, googleProvider } from '../firebase';
import './Signin.css';
import { Link } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleShowPassword = () => setShowPassword(v => !v);

  const signInWithGoogle = async () => {
    if(loading) return;
    setLoading(true);
    try{
      await signInWithPopup(auth, googleProvider);
    }
    catch(err){
      setError(err.message);
    }
    finally{
      setLoading(false);
    }
  }

  const signInWithEmail = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } 
    catch (err) {
      setError(err.message);
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
        <h2>Sign In</h2>
        <button 
            onClick={signInWithGoogle}
            className="btn google-btn"
            disabled={loading}
        >
            {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        <div className="divider">Or</div>
        <form onSubmit={signInWithEmail}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <label className="password-label">
              Password
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>
            <button 
              type="submit" 
              className="btn email-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in with Email'}
            </button>

            <div>
              <span>Don't have an account? </span>
              <Link to={"/signup"} className="link-btn">Sign Up</Link>
            </div>
            {error && <div className="error">{error}</div>}
        </form>
    </div>
  );
};

export default SignIn;
