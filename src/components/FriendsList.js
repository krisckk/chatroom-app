import React, { useState, useEffect} from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './FriendsList.css'

export default function FriendsList({onSelect = () => {} }) {
    const me = auth.currentUser.uid;
    const [friends, setFriends]     = useState([]);
    const [nameInput, setNameInput]   = useState('');
    const [error, setError]         = useState('');

    // Listen for changes in your friends subcollection
    useEffect(() => {
        const friendsCol = collection(db, 'users', me, 'friends');
        const unsub = onSnapshot(friendsCol, snap => {
            setFriends(snap.docs.map(d => d.data()));
        },
        err => {
          console.error("Error loading friends:", err);
        });
        return unsub;
      }, [me]);

    const addFriend = async e => {
        e.preventDefault();
        setError('');
        const username = nameInput.trim();
    
        try {
            // 1. find user by displayName
            const usersQ = query(
                collection(db, 'users'),
                where('displayName', '==', username)
            );
            const userSnap = await getDocs(usersQ);
            if (userSnap.empty) {
                setError('No user found with that name.');
                return;
            }
            const userDoc = userSnap.docs[0];
            const friendUID = userDoc.id;
            const friendData = { UID: friendUID, displayName: userDoc.data().displayName, email: userDoc.data().email, photoData: userDoc.data().photoData };
        
            if (friendUID === me) {
                setError("You can't add yourself.");
                return;
            }
        
            // 2. write into your subcollection
            await setDoc(doc(db, 'users', me, 'friends', friendUID), friendData);
            await setDoc(
                doc(db, 'users', friendUID, 'friends', me), {
                  UID: me,
                  displayName: auth.currentUser.displayName,
                  email: auth.currentUser.email,
                  photoData: auth.currentUser.photoData
                }
            );
            setNameInput('');
        } 
        catch (err) {
            console.error('Error adding friend', err);
            setError('Failed to add friend.');
        }
      };

    return (
        <div className="friends-container">
          <div className="friends-header">Friends</div>
    
          <form className="add-friend-form" onSubmit={addFriend}>
            <input
              type="text"
              placeholder="Friend's username"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              required
            />
            <button type="submit">Add</button>
          </form>
          {error && <div className="error">{error}</div>}
    
          <ul className="friends-list">
            {friends.map(f => (
              <li
                key={f.uid}
                className="friend-item"
                onClick={() => onSelect(f)}
              >
                {f.displayName}
              </li>
            ))}
          </ul>
        </div>
      );
};
