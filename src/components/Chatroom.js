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

    // Whenever activeFriend changes, re‑subscribe to that chat
    useEffect(() => {
        setMessages([]);
        if (!activeFriend) return; // No friend selected

        setLoading(true);
        const me = auth.currentUser.uid;
        // Build a stable participants array
        const participants = [me, activeFriend].sort();

        const q = query(
            collection(db, 'messages'),
            where('participants', '==', participants),
            orderBy('createdAt')
        );

        const unsubscribe = onSnapshot(
        q,
        snap => {
            setMessages(snap.docs.map(d => ({ ...d.data(), id: d.id })));
            setLoading(false);
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        err => {
            console.error('Error loading chat:', err);
            setLoading(false);
        }
        );

        return unsubscribe;
    }, [activeFriend]);

    const sendMessage = async (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if(!activeFriend){
            alert("Please select a friend to chat with first");
            return;
        }
        if (text === "") return;

        const me = auth.currentUser;
        const participants = [me.uid, activeFriend].sort();

        try {
            await addDoc(collection(db, 'messages'), {
                text,
                createdAt: serverTimestamp(),
                uid: me.uid,
                displayName: me.displayName || 'Anonymous',
                participants,
                receiverId: activeFriend,
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
