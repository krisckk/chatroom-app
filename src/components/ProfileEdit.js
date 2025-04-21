import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile} from 'firebase/auth';
import './Profile.css';

export default function ProfileEdit() {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const uid = user?.uid;

    const [displayName, setDisplayName] = useState('');
    const [photoData, setPhotoData]     = useState('');
    const [bio, setBio]                 = useState('');
    const [error, setError]             = useState('');

    // Load existing
    useEffect(() => {
        if (!uid) return navigate('/');
        (async () => {
        try {
            const snap = await getDoc(doc(db, 'profiles', uid));
            if (snap.exists()) {
                const d = snap.data();
                setDisplayName(d.displayName || '');
                setPhotoData(d.photoData || '');
                setBio(d.bio || '');
            }
        }
        catch (e) {
            console.error(e);
            setError('Could not load your data.');
        }
        })();
    }, [uid, navigate]);

    const handleFileChange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                const MAX_DIMENSION = 300;
    
                let { width, height } = img;
                // Compute new dimensions preserving aspect ratio
                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                    }
                } 
                else {
                    if (height > MAX_DIMENSION) {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                    }
                }
                // Draw to offscreen canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
        
                // Export as JPEG with 0.7 quality (adjust 0.5–0.8 to tune size/quality)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                const sizeInBytes = atob(compressedDataUrl.split(',')[1]).length;
                console.log(`Compressed image size: ${sizeInBytes} bytes`);
        
                setPhotoData(compressedDataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async e => {
        e.preventDefault();

        await updateProfile(user, { 
            displayName,
            photoData: photoData ? photoData : undefined
        });

        try {
            await setDoc(doc(db, 'users', uid), {
                displayName: user.displayName,
                email: user.email,
                photoData,
                bio
            });
            console.log(displayName);
            navigate('/profile');
        } 
        catch (e) {
            console.error(e);
            setError('Save failed.');
        }
    };

    return (
        <div className="profile-container">
        <h2>Edit Profile</h2>
        {error && <div className="error">{error}</div>}

        <form className="profile-form" onSubmit={handleSave}>
            <label>
            Name
            <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
            />
            </label>

            <label>
            Photo
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />
            </label>

            {photoData && (
            <img
                className="profile-preview"
                src={photoData}
                alt="Preview"
            />
            )}

            <label>
            Bio
            <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A little about you"
            />
            </label>

            <div className="profile-buttons">
            <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/profile')}
            >
                Cancel
            </button>
            <button type="submit" className="save-btn">
                Save
            </button>
            </div>
        </form>
        </div>
    );
}