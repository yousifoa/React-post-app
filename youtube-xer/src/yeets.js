// Yeets.js
import React, { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import IosShareIcon from '@mui/icons-material/IosShare';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import PostDetails from './PostDetails.js';
import './card.css';
import { getDocs } from 'firebase/firestore';
import { collection, updateDoc, addDoc, query, where, serverTimestamp, doc, deleteDoc, runTransaction, getDoc, onSnapshot } from 'firebase/firestore';
import {  ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import auth from './firebase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DeleteIcon from '@mui/icons-material/Delete';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';

const Yeets = ({ searchQuery, openDialog, setOpenDialog, showYeets }) => {
  const [originalVideoData, setOriginalVideoData] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', description: '', image: null }); // Updated state with image field
  const [titleError, setTitleError] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [filteredVideoData, setFilteredVideoData] = useState([]);
  const [user] = useAuthState(auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuPost, setSelectedMenuPost] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const handleUploadImage = (event) => {
    // Set the image file in the state
    const file = event.target.files[0];
    setNewPost((prev) => ({ ...prev, image: file }));
  };

const handleLike = async (id, e) => {
    // Check if the user is authenticated
    const user = auth.currentUser;
    if (!user) {
        console.log('User not authenticated. Please log in.');
        e.stopPropagation(); // Stop event propagation
        return;
    }

    e.stopPropagation(); // Stop event propagation

    const postRef = doc(db, 'posts', id);
    let postData;

    try {
        await runTransaction(db, async (transaction) => {
            const postDoc = await getDoc(postRef);
            postData = postDoc.data();

            // Check if the user has already liked the post
            const likesQuery = query(collection(db, 'likes'), where('postId', '==', id), where('userId', '==', user.uid));
            const likesSnapshot = await getDocs(likesQuery);
            const hasLiked = !likesSnapshot.empty;

            if (hasLiked) {
                // User has already liked, so unlike
                await deleteDoc(likesSnapshot.docs[0].ref);
                transaction.update(postRef, {
                    likes: Math.max(postData.likes - 1, 0),
                    isLiked: false,
                });
            } else {
                // User has not liked, so like
                await addDoc(collection(db, 'likes'), {
                    postId: id,
                    userId: user.uid,
                });
                transaction.update(postRef, {
                    likes: postData.likes + 1,
                    isLiked: true,
                });
            }
        });

        // Update local state after a successful like operation
        setOriginalVideoData((prevData) =>
            prevData.map((video) =>
                video.id === id
                    ? {
                        ...video,
                        likes: postData.isLiked ? postData.likes - 1 : postData.likes + 1,
                        isLiked: !postData.isLiked,
                    }
                    : video
            )
        );

        // Show success notification
        toast.success(postData.isLiked ? 'You unliked the post' : 'You liked the post');

    } catch (error) {
        console.error('Error updating like: ', error);
        // Show error notification
        toast.error('Error updating like');
    }
};


  const isOlderThanADay = (date) => {
    const now = new Date();
    const diffInMilliseconds = now - date;
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    return diffInDays >= 1;
  };

  const handleDescriptionClick = (event) => {
    // Stop the click event from reaching the card and triggering the card click
  };

  const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
      return description.substring(0, maxLength - 3) + '...'; // Truncate and add ellipsis
    }
    return description;
  };

  useEffect(() => {
    const filterPosts = () => {
      if (searchQuery.trim() === '') {
        // If search query is empty, show all original posts
        setFilteredVideoData([...originalVideoData]);
      } else {
        // If search query is not empty, filter posts based on the query
        const filteredPosts = originalVideoData.filter(video =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredVideoData(filteredPosts);
      }
    };
  
    filterPosts();
  }, [searchQuery, originalVideoData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
          const postData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate(); // Convert Firebase Timestamp to JavaScript Date
            postData.push({ ...data, id: doc.id, createdAt });
          });
          setOriginalVideoData(postData);
          setFilteredVideoData(postData); // Update filteredVideoData here
        });

        return () => unsubscribe(); // Cleanup function
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };
  
    fetchData();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    // Function to handle real-time updates for likes
    const handleLikesUpdate = async (snapshot) => {
      const likeData = snapshot.data();
      const postId = snapshot.id;

      // Update the originalVideoData state to reflect the new like count
      setOriginalVideoData((prevData) =>
        prevData.map((video) =>
          video.id === postId
            ? {
                ...video,
                likes: likeData.likes,
                isLiked: likeData.isLiked,
              }
            : video
        )
      );
    };

    // Listen for real-time updates on the likes collection
    const unsubscribeLikes = onSnapshot(collection(db, 'likes'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          handleLikesUpdate(change.doc);
        }
      });
    });

    return () => unsubscribeLikes(); // Cleanup function
  }, []);

  const [createPostError, setCreatePostError] = useState(null);

  const handleCreatePost = async () => {
    // Check if the user is authenticated
    if (!user) {
      // Show a message and update the state to display it in the form
      setCreatePostError('You must be signed in to create a post.');
      return;
    }

    // Check if the title or description has zero characters and prevent posting
    if (newPost.title.trim().length === 0 || newPost.description.trim().length === 0) {
      return;
    }

    try {
      // Add the new post to the 'posts' collection
      const newPostRef = await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        title: newPost.title.substring(0, 75),
        description: newPost.description,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp(),
      });
  
      console.log('Document written with ID: ', newPostRef.id);
  
      // Upload image to Firebase Storage if it exists
      if (newPost.image) {
        const storageRef = ref(storage, `images/${newPostRef.id}`);
        await uploadBytes(storageRef, newPost.image);
        
        // Get the download URL for the image
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update the post document with the image URL
        await updateDoc(newPostRef, { image: downloadURL });
      }
  

      // Show success notification
      toast.success('Post created successfully');

      setOpenDialog(false);
      setNewPost({ title: '', description: '' });
      setTitleError(false);
      setCreatePostError(null);
    } catch (error) {
      console.error('Error adding document: ', error);
      // Show error notification
      toast.error('Error creating post');
    }
  };

  const handleShare = (id, e) => {
    // Implement the functionality you want when the "Share" button is clicked
    // For now, let's log a message
    console.log(`Share button clicked for post with ID ${id}`);

    // Prevent event propagation to the parent card
    e.stopPropagation();
  };

  const updatePostComments = (postId, updatedComments) => {
    setPostComments((prevComments) => ({
      ...prevComments,
      [postId]: updatedComments,
    }));
  };

  const handleComment = (id, e) => {
    // Implement the functionality you want when the "Comment" button is clicked
    // For now, let's log a message
    console.log(`Comment button clicked for post with ID ${id}`);

    // Get the existing comments for the selected post
    const existingComments = postComments[selectedPost?.id] || [];

    // Update the comments for the selected post
    updatePostComments(selectedPost?.id, [...existingComments, 'New Comment']);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setNewPost((prev) => ({ ...prev, title: newTitle }));
    setTitleError(newTitle.length > 75);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleClosePostDetails = () => {
    setSelectedPost(null);
  };

  const handleMore = (id, e) => {
    setAnchorEl(e.currentTarget);
    setSelectedMenuPost(id);
    e.stopPropagation();
  };

  const handleMenuItemClick = async (menuItem, e) => {
    switch (menuItem) {
      case 'delete':
        // Implement delete functionality for the current user's posts
        if (selectedMenuPost) {
          try {
            // Retrieve the post data
            const postRef = doc(db, 'posts', selectedMenuPost);
            const postDoc = await getDoc(postRef);

            // Check if the current user is the owner of the post
            if (postDoc.exists() && user && postDoc.data().userId === user.uid) {
              // Delete the post with the selectedMenuPost.id
              await deleteDoc(postRef);

              // Update the state to remove the deleted post
              setOriginalVideoData((prevData) =>
                prevData.filter((video) => video.id !== selectedMenuPost)
              );
              toast.success('Post deleted successfully');

            } else {
              console.log('Unauthorized deletion attempt or post not found.');
              toast.error('Unauthorized deletion attempt');
            }

            // Close the menu
            setAnchorEl(null);
            setSelectedMenuPost(null);
          } catch (error) {
            console.error('Error deleting post: ', error);
          }
        }
        break;

      default:
        break;
    }
  };






/* announcement json firebase data =
{
id = 1 number

englishText = aaa string

arabicText = ههه string
}
*/
  
  const Announcement = ({ id, englishText, arabicText }) => ({
    id,
    englishText,
    arabicText,
  });
  
  const fetchAnnouncements = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'announcements'));
      const announcementsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcementsData.push(Announcement({
          id: doc.id,
          englishText: data.englishText,
          arabicText: data.arabicText,
        }));
      });
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };
  
const renderAnnouncements = () => {
  if (announcements.length === 0) return null;

  return (
    <div className="announcement-container">
      {announcements.map((announcement) => (
        <div key={announcement.id} className={`announcement-card ${announcement.type}`}>
          <div className="announcement-content">
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>{announcement.englishText}</h2>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{announcement.arabicText}</p>
          </div>
          <div className="announcement-footer">
          </div>
        </div>
      ))}
    </div>
  );
};

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="dark"
      />

      <div id="video-cards">
      {renderAnnouncements()}

        {filteredVideoData.map((video) => (
          <div key={video.id} className="video-card" onClick={() => { handlePostClick(video); showYeets(); }}>
            
            <div className="video-info">
              
              <h3 style={{ fontSize: '1.5em', marginTop: '55px' }}>{video.title}</h3>
              <p onClick={handleDescriptionClick}>{truncateDescription(video.description, 30)}</p>
              <p style={{ color: '#888', marginTop: '8px' }}>
                {video.createdAt instanceof Date
                  ? isOlderThanADay(video.createdAt)
                    ? `Created on: ${video.createdAt.toLocaleDateString()}`
                    : `Created at: ${video.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Invalid date'}
              </p>
              <div className="interaction-buttons">
                <IconButton
                  size="small"
                  color={video.isLiked ? 'secondary' : 'inherit'}
                  onClick={(e) => handleLike(video.id, e)}
                >
                  <FavoriteBorderIcon fontSize="small" />
                </IconButton>
                <span>{video.likes}</span>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => handleComment(video.id, e)}
                >
                  <ChatBubbleOutlineIcon fontSize="small" />
                </IconButton>
                <span>{video.comments}</span>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => handleShare(video.id, e)}
                >
                  <IosShareIcon fontSize="small" />
                </IconButton>
                {/* Move the Menu component here */}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => handleMore(video.id, e)}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
                <Menu
                  id="more-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => {
                    setAnchorEl(null);
                    setSelectedMenuPost(null);
                  }}
                >
                  <MenuItem onClick={() => handleMenuItemClick('delete')}>Delete</MenuItem>
                  {/* Add more menu items as needed */}
                </Menu>
              </div>
            </div>
          </div>
        ))}
      </div>
      <PostDetails
        post={selectedPost}
        onClose={handleClosePostDetails}
        updatePostData={setOriginalVideoData}
        comments={postComments[selectedPost?.id] || []}
        updatePostComments={(updatedComments) => updatePostComments(selectedPost?.id, updatedComments)}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create a New Post</DialogTitle>
        <DialogContent>
          <TextField
            className="dark-textfield title-textfield"
            label="Title"
            fullWidth
            value={newPost.title}
            onChange={handleTitleChange}
            error={titleError}
            helperText={titleError ? 'Title exceeds 75 characters' : ''}
            style={{ marginTop: '16px' }}
          />
          {createPostError && (
            <p className="error-message">{createPostError}</p>
          )}
          <TextField
            className="dark-textfield description-textfield"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newPost.description}
            onChange={(e) =>
              setNewPost((prev) => ({ ...prev, description: e.target.value }))
            }
            style={{ marginTop: '16px' }}
          />
          {/* Input field for uploading images */}
          <input
            accept="image/*"
            type="file"
            style={{ display: 'none' }}
            id="upload-image"
            onChange={handleUploadImage}
          />
          <label htmlFor="upload-image">
            <Button
              variant="contained"
              component="span"
              startIcon={<AddAPhotoIcon />}
              style={{ marginTop: '16px' }}
            >
              Upload Image
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            className="create-button"
            onClick={handleCreatePost}
            endIcon={<SendIcon />}
            variant="contained"
            disabled={titleError || newPost.title.trim().length === 0 || newPost.description.trim().length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Yeets;
