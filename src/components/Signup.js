import React, { useState} from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FaEye, FaEyeSlash }                     from 'react-icons/fa';
import { auth } from "../firebase";
import './Signin.css';

const SignUp = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleShowPassword = () => setShowPassword(v => !v);

    const handleSignUp = async e => {
        e.preventDefault();
        setError('');

        // Validate confirm password
        if(password !== confirmPassword){
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try{
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/chat');
        }
        catch(err){
            setError({
                'auth/email-already-in-use': 'Email already in use.',
                'auth/invalid-email':        'Invalid email address.',
                'auth/weak-password':        'Password should be ≥ 6 characters.',
              }[err.code] || 'Sign‑up failed. Check console.');
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="signin-container">
            <h2>Sign Up</h2>

            <form onSubmit={handleSignUp}>
                <input 
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <label className="password-label">
                    Password
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password(>= 6 characters)"
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

                <label className="password-label">
                    Confirm Password
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
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

                {error && <div className="error">{error}</div>}

                <button
                    type="submit"
                    className="btn email-btn"
                    disabled={loading}
                >
                    {loading ? "Signing up..." : "Sign up"}
                </button>
            </form>

            <div className="footer">
                <span>Already have an account?</span>
                <button
                    className="link-btn"
                    onClick={() => navigate('/')}
                >Sign In</button>
            </div>
        </div>
    );
}
export default SignUp;