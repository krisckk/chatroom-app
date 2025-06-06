// src/components/ProfileView.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Profile.css';

export default function ProfileView() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const uid = user?.uid;

  const [userProfile, setUserProfile] = useState({
    displayName: '',
    photoData: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return navigate('/');
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) setUserProfile(snap.data());
      } 
      catch (e) {
        console.error(e);
        setError('Failed to load user profile.');
      } 
      finally {
        setLoading(false);
      }
    })();
  }, [uid, navigate]);

  if (loading) {
    return (
      <div className="profile-container">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      {error && <div className="error">{error}</div>}

      {userProfile.photoData && (
        <img
          className="profile-preview"
          src={userProfile.photoData}
          alt="Profile"
        />
      )}

      <p><strong>Name:</strong> {userProfile.displayName}</p>
      <p><strong>Bio:</strong> {userProfile.bio}</p>

      <div className="profile-buttons">
        <button
          className="cancel-btn"
          onClick={() => navigate('/chat')}
        >
          Back to Chat
        </button>
        <button
          className="save-btn"
          onClick={() => navigate('/profile/edit')}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
} 