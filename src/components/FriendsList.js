import React, { useState, useEffect} from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './FriendsList.css'

const FriendsList = (onSelect) => {
    const me = auth.currentUser.uid;
    const [friends, setFriends]     = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [nameInput, setNameInput]   = useState('');
    const [error, setError]         = useState('');

    // Listen for changes in your friends subcollection
    useEffect(() => {
        const friendsCol = collection(db, 'users', me, 'friends');
        const unsub = onSnapshot(friendsCol, snap => {
            setFriends(snap.docs.map(d => d.data()));
        });
        return unsub;
      }, [me]);

    const addFriend = async e => {
        e.preventDefault();
        setError('');
    
        try {
            // 1. find user by displayName
            const usersQ = query(
                collection(db, 'users'),
                where('displayName', '==', nameInput.trim())
            );
            const userSnap = await getDocs(usersQ);
            if (userSnap.empty) {
                setError('No user found with that name.');
                return;
            }
        
            const friendDoc  = userSnap.docs[0];
            const friendData = { uid: friendDoc.id, ...friendDoc.data() };
        
            if (friendData.uid === me) {
                setError("You can't add yourself.");
                return;
            }
        
            // 2. write into your subcollection
            await setDoc(
                doc(db, 'users', me, 'friends', friendData.uid),
                friendData
            );
            setNameInput('');
        } 
        catch (err) {
            console.error(err);
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
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
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
                onClick={() => onSelect(f.uid)}
              >
                {f.displayName}
              </li>
            ))}
          </ul>
        </div>
      );
};

export default FriendsList;