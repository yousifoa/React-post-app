import React, { useState } from 'react';
import './LoginForm.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import auth from './firebase'; // Import the auth instance from firebase.js
import { db, storage } from './firebase'; // Import the firestore and storage instances

export default function LoginForm({ setShowLoginForm }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between sign up and sign in forms

  const handleSignIn = async () => {
    try {
      // Sign in an existing user with email and password
      await signInWithEmailAndPassword(auth, email, password);

      // You can add additional logic here, e.g., redirect to a different page
      console.log('User signed in successfully!');

      // Close the login form on success
      setShowLoginForm(false);
    } catch (error) {
      console.error('Error signing in, make sure both email and password are correct');

      // Set the error state to display the error message
      setError('Error signing in, make sure both email and password are correct');
    }
  };

  const handleSignUp = async () => {
    try {
      // Create a new user account with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Get the user object from the userCredential
      const user = userCredential.user;

      // Update the user's profile with the provided username
      await updateProfile(user, { displayName: username });

      // Upload profile photo if selected
      if (profilePhoto) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(storageRef, profilePhoto);
        const photoURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL }); // Update user's profile with the photoURL
      }

      // You can add additional logic here, e.g., redirect to a different page
      console.log('User account created successfully!');

      // Close the login form on success
      setShowLoginForm(false);
    } catch (error) {
      console.error('Error creating user:', error.message);

      // Set the error state to display the error message
      setError('Error creating user: ' + error.message);
    }
  };

  const handleClose = () => {
    // Reset the error state when closing the form
    setError(null);
    setShowLoginForm(false);
  };

  return (
    <div className="LoginForm">
      <div className="form">
        <div className="closeButton" onClick={handleClose}>
          X
        </div>
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>

        {error && <div className="error">{error}</div>}

        <div className="input">
          <div className="inputBox">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              placeholder="example@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {isSignUp && (
            <div className="inputBox">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Ahmed"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          <div className="inputBox">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              placeholder="*****"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {isSignUp && (
            <div className="inputBox">
              <label htmlFor="profilePhoto">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                name="profilePhoto"
                onChange={(e) => setProfilePhoto(e.target.files[0])}
              />
            </div>
          )}
          <div className="inputBox">
            {isSignUp ? (
              <input type="submit" name="" value="Sign Up" onClick={handleSignUp} />
            ) : (
              <input type="submit" name="" value="Sign In" onClick={handleSignIn} />
            )}
          </div>
          <div className="inputBox">
            <p>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <span className="toggleForm" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
