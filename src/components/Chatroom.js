import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaTrash } from 'react-icons/fa';
import FriendsList from './FriendsList';
import './Chatroom.css';

const Message = ({ msg, isCurrentUser, onDelete }) => (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
        <span className="message-sender">{msg.displayName}</span>
        <span className="message-text">{msg.text}</span>
        {isCurrentUser && (
            <button
                className="delete-btn"
                onClick={() => onDelete(msg.id)}
                aria-label="Delete message"
            >
                <FaTrash />
            </button>
        )}
    </div>
);

const Chatroom = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeFriend, setActiveFriend] = useState(null);
    const scrollRef = useRef();
    const navigate = useNavigate();
    const meUID = auth.currentUser.uid;

    // Whenever activeFriend changes, re‑subscribe to that chat
    useEffect(() => {
        if (!activeFriend) {
            setMessages([]);
            return;
        }

        setLoading(true);
        // Build a stable participants array
        const friendUID = activeFriend.uid;
        const conversationID = [meUID, friendUID].sort().join('_');
        const participants = [meUID, activeFriend].sort();

        const q = query(
            collection(db, 'messages'),
            where('conversationID', '==', conversationID),
            orderBy('createdAt')
        );

        const unsubscribe = onSnapshot(
        q,
        snap => {
            setMessages(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            setLoading(false);
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        err => {
            console.error('Error loading chat:', err);
            setLoading(false);
        }
        );

        return unsubscribe;
    }, [activeFriend, meUID]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if(!activeFriend){
            alert('Please sleect a friend first');
            return;
        }
        const text = newMessage.trim();
        if(!text) return;

        const  friendUID = activeFriend.uid;
        const conversationID = [meUID, friendUID].sort().join('_');
        const participants = [meUID, activeFriend].sort();

        try {
            await addDoc(collection(db, 'messages'), {
                text,
                createdAt: serverTimestamp(),
                uid: meUID,
                displayName: auth.currentUser.displayName || 'Anonymous',
                receiverId: friendUID,
                conversationID
            });
            setNewMessage('');
        }
        catch(err){
            console.error("Error sending message: ", err);
        }
    };

    const deleteMessage = async id => {
        if(!window.confirm("Delete this message?")) return;
        try {
            await deleteDoc(doc(db, 'messages', id));
        }
        catch(err){
            console.error("Error deleting message:", err);
        }
    };

    return (
        <div className='chat-app-container'>
            <FriendsList onSelect={setActiveFriend} />
            <div className="chat-container">
                <div className="chat-header">
                    {activeFriend ? `Chat with ${activeFriend}` : 'Select a friend to start chatting'}
                    <div className='header-buttons'>
                        <button className='profile-btn' onClick={() => navigate('/profile')}>Profile</button>
                        <button className='signout-btn' onClick={() => auth.signOut()}>Sign Out</button>
                    </div>
                </div>
                
                <div className="chat-messages">
                    {loading && <div className="loading">Loading…</div>}
                    {!loading && activeFriend &&
                        messages.map(msg => (
                            <Message
                                key={msg.id}
                                msg={msg}
                                isCurrentUser={msg.uid === auth.currentUser.uid}
                                onDelete={deleteMessage}
                            />
                        ))}
                    <div ref={scrollRef} />
                </div>

                <form className="chat-input-form" onSubmit={sendMessage}>
                    <div className='input-wrapper'>
                        <input
                            className="chat-input"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder={
                                activeFriend ? 'Type a message...' : 'Select a friend to chat...'
                            }
                            aria-label="Message input"
                        />
                        <button 
                            type="submit" 
                            className="send-btn" 
                            aria-label="Send message"
                            disabled={!activeFriend || !newMessage.trim()}
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chatroom;
