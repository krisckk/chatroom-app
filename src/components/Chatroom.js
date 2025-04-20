import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa';
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
    const scrollRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        if(!auth.currentUser){
            console.warn("No authenticated user found in Chatroom component");
            setLoading(false);
            return () => {};
        }
        const q = query(collection(db, 'messages'), orderBy('createdAt'));
        try {
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                    setLoading(false);
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                },
                (error) => {
                    console.error("Error fetching messages: ", error);
                    setLoading(false);
                }
            );
            
            return unsubscribe;
        } 
        catch (error) {
            console.error("Error setting up snapshot listener:", error);
            setLoading(false);
            return () => {};
        }
    }, []);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        setNewMessage('');
        console.log('Input cleared - before Firebase operation');

        if(!auth.currentUser){
            console.warn("No authenticated user found in sendMessage function");
            return;
        }
        
        try {
            await addDoc(collection(db, 'messages'), {
                text: newMessage.trim(),
                createdAt: serverTimestamp(),
                uid: auth.currentUser.uid,
                displayName: auth.currentUser.displayName || 'Anonymous',
            });
            setNewMessage('');
            console.log("Message sent successfully");
        } 
        catch (error) {
            console.error("Error sending message: ", error);
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
        <div className="chat-container">
            <div className="chat-header">
                Chatroom
                <button
                    className="profile-btn"
                    onClick={() => navigate('/profile')}
                >
                    Profile
                </button>
                <button 
                    className="signout-btn" 
                    onClick={() => auth.signOut()}
                >
                    Sign Out
                </button>
            </div>
            
            <div className="chat-messages">
                {loading ? (
                    <div className="loading"></div>
                ) : (
                    messages.map(msg => (
                        <Message
                            key={msg.id}
                            msg={msg}
                            isCurrentUser={msg.uid === auth.currentUser.uid}
                            onDelete={deleteMessage}
                        />
                    ))
                )}
                <div ref={scrollRef} />
            </div>
            <form className="chat-input-form" onSubmit={sendMessage}>
                <div className='input-wrapper'>
                    <input
                        className="chat-input"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Write a message..."
                        aria-label="Message input"
                    />
                    <button type="submit" className="send-btn" aria-label="Send message">
                        <FaPaperPlane />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chatroom;
