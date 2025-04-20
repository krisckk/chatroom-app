import React from 'react';
import { auth } from '../firebase';

const Signout = () => (
  auth.currentUser && <button onClick={() => auth.signOut()}>Sign Out</button>
);

export default Signout;
