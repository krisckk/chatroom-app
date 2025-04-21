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

export default function Chatroom() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeFriend, setActiveFriend] = useState(null);
    const scrollRef = useRef();
    const navigate = useNavigate();
    const meUID = auth.currentUser.uid;
    
    // Derive friend UID and name
    const friendUID = activeFriend?.uid;
    const friendName = activeFriend?.displayName;

    // Whenever activeFriend changes, re‑subscribe to that chat
    useEffect(() => {
        if (!friendUID) {
            setMessages([]);
            return;
        }
        setLoading(true);
        // Build a stable participants array
        const conversationId = [meUID, friendUID].sort().join('_');

        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
        q,
        snap => {
            setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        err => {
            console.error('Error loading chat:', err);
            setLoading(false);
        }
        );

        return unsubscribe;
    }, [friendUID, meUID]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if(!friendUID){
            alert('Please sleect a friend first');
            return;
        }
        const text = newMessage.trim();
        if(!text) return;

        const conversationId = [meUID, friendUID].sort().join('_');

        try {
            await addDoc(collection(db, 'messages'), {
                text,
                createdAt: serverTimestamp(),
                uid: meUID,
                displayName: auth.currentUser.displayName || 'Anonymous',
                senderId: meUID,
                receiverId: friendUID,
                conversationId
            });
            setNewMessage('');
        }
        catch(err){
            console.error("Error sending message: ", err);
        }
    };

    const deleteMessage = async (id, senderId) => {
        if(senderId !== meUID) return;
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
            <FriendsList onSelect={friend => setActiveFriend(friend)} />
            <div className="chat-container">
                <div className="chat-header">
                    {friendName ? `${friendName}}'s Chatroom` : 'Select a friend to start chatting'}
                    <div className='header-buttons'>
                        <button className='profile-btn' onClick={() => navigate('/profile')}>Profile</button>
                        <button className='signout-btn' onClick={() => auth.signOut()}>Sign Out</button>
                    </div>
                </div>
                
                <div className="chat-messages">
                    {loading && <div className="loading">Loading…</div>}
                    {!loading && friendUID &&
                        messages.map(msg => (
                            <Message
                                key={msg.id}
                                msg={msg}
                                isCurrentUser={msg.senderId === meUID}
                                onDelete={deleteMessage}
                            />
                        ))}
                    <div ref={scrollRef} />
                </div>

                <form className="chat-input-form" onSubmit={sendMessage}>
                    <div className='input-wrapper'>
                        <input
                            tyoe="text"
                            className="chat-input"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder={
                                friendName ? 'Type a message...' : 'Select a friend to chat...'
                            }
                            aria-label="Message input"
                            disabled={!friendUID}
                        />
                        <button 
                            type="submit" 
                            className="send-btn" 
                            aria-label="Send message"
                            disabled={!friendUID || !newMessage.trim()}
                            onClick={sendMessage}
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
