import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from 'firebase/storage';
import './Profile.css';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import { Edit, AddAPhoto, Delete, ExitToApp } from '@mui/icons-material';

function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [profilePhotoURL, setProfilePhotoURL] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const storageRef = ref(storage, `profilePhotos/${currentUser.uid}`);
        try {
          const url = await getDownloadURL(storageRef);
          setProfilePhotoURL(url);
        } catch (error) {
          console.error('Error fetching profile photo:', error);
        }

        const q = query(collection(db, 'posts'), where('userId', '==', currentUser.uid));
        try {
          const querySnapshot = await getDocs(q);
          const userPosts = [];
          querySnapshot.forEach((doc) => {
            userPosts.push({ id: doc.id, ...doc.data() });
          });
          setPosts(userPosts);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
      } else {
        setUser(null);
        setProfilePhotoURL(null);
        setPosts([]);
      }
    });

    return unsubscribe;
  }, []);

  const handleUploadPhoto = async (event) => {
    if (!user) {
      console.error('User is not signed in');
      return;
    }

    setIsUploadingPhoto(true);

    const file = event.target.files[0];
    const storageRef = ref(storage, `profilePhotos/${user.uid}`);
    try {
      await uploadBytes(storageRef, file);
      await updateDoc(doc(db, 'users', user.uid), {
        profilePhotoURL: await getDownloadURL(storageRef),
      });
      setProfilePhotoURL(await getDownloadURL(storageRef));
      console.log('Profile photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      const postImageRef = ref(storage, `postImages/${postId}`);
      await deleteObject(postImageRef);
      setPosts(posts.filter((post) => post.id !== postId));
      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          {profilePhotoURL ? (
            <Avatar alt="Profile" src={profilePhotoURL} sx={{ width: 80, height: 80 }} />
          ) : (
            <Avatar alt="Profile" sx={{ width: 80, height: 80 }} />
          )}
          <h3>Welcome, {user?.displayName}</h3>
          <Button
            variant="contained"
            color="error"
            startIcon={<ExitToApp />}
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
        <div className="profile-actions">
          <label htmlFor="upload-photo">
            <input
              type="file"
              accept="image/*"
              id="upload-photo"
              style={{ display: 'none' }}
              onChange={handleUploadPhoto}
            />
            <Button
              variant="contained"
              component="span"
              startIcon={<AddAPhoto />}
              disabled={isUploadingPhoto}
            >
              Change Photo
            </Button>
          </label>
        </div>
      </div>
      <div className="posts-section">
        <h2>Your Posts:</h2>
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <IconButton onClick={() => handleDeletePost(post.id)}>
                <Delete />
              </IconButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
