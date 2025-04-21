import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SignIn from './components/Signin';
import SignUp from  './components/Signup';
import Chatroom from './components/Chatroom';
import ProfileView from './components/ProfileView';
import ProfileEdit from './components/ProfileEdit';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if(user) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName,
          email: user.email,
        }, { merge: true });
      }
    });
    return unsub;
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/chat" /> : <SignIn />} />
        <Route path="/chat" element={user ? <Chatroom /> : <Navigate to="/" />} />
        <Route path="signup" element={user ? <Navigate to="/chat" /> : <SignUp />} /> {/* ← new */}
        <Route path="/profile" element={user ? <ProfileView /> : <Navigate to="/" />} />
        <Route path="/profile/edit" element={user ? <ProfileEdit /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
