import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, serverTimestamp } from './firebase';

const Comment = ({ comment, onLike }) => (
  <Box
    bgcolor="#333"
    color="#fff"
    borderRadius="8px"
    padding="8px"
    marginBottom="8px"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <p>{comment.text}</p>
      <div>
        <IconButton onClick={onLike} color="inherit">
          <FavoriteIcon color={comment.isLiked ? 'error' : 'inherit'} />
        </IconButton>
        <span>{comment.likes}</span>

      </div>
    </div>
  </Box>
);

const PostDetails = ({ post, onClose, updatePostData }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(post?.likes || 0);
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [shares, setShares] = useState(post?.shares || 0);
  const [createdAt, setCreatedAt] = useState(post?.createdAt || null);

  const MAX_COMMENT_LENGTH = 250;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (post) {
          const commentsQuery = query(collection(db, 'comments'), where('postId', '==', post.id));
          const commentsSnapshot = await getDocs(commentsQuery);
          const commentsData = commentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Sort comments by likes count
          const sortedComments = commentsData.sort((a, b) => b.likes - a.likes);
          setComments(sortedComments);
        }
      } catch (error) {
        console.error('Error fetching comments: ', error);
      }
    };

    fetchComments();
    setLikes(post?.likes || 0);
    setShares(post?.shares || 0);
    setIsLiked(post?.isLiked || false);
    setCreatedAt(post?.createdAt || null);
  }, [post]);

  const handleComment = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Please log in.');
      toast.error('User not authenticated. Please log in.');
      return;
    }

    if (comment.trim() === '' || comment.length > MAX_COMMENT_LENGTH) {
      return;
    }

    try {
      const newCommentRef = await addDoc(collection(db, 'comments'), {
        postId: post.id,
        text: comment,
        userId: user.uid,
        likes: 0, // Initial likes count for the comment
        isLiked: false, // Initial liked state for the comment
        createdAt: serverTimestamp(),
      });

      setComments((prevComments) => [
        ...prevComments,
        { id: newCommentRef.id, postId: post.id, text: comment, userId: user.uid, likes: 0, isLiked: false, createdAt: new Date() },
      ]);

      updatePostData((prevData) =>
        prevData.map((video) =>
          video.id === post.id
            ? {
                ...video,
                comments: video.comments + 1,
              }
            : video
        )
      );

      setComment('');
    } catch (error) {
      console.error('Error adding comment: ', error);
      toast.error('Error adding comment. Please try again.');
    }
  };

  const handleLike = async (commentId) => {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Please log in.');
      toast.error('User not authenticated. Please log in.');
      return;
    }

    const commentRef = doc(db, 'comments', commentId);
    let commentData;

    try {
      await runTransaction(db, async (transaction) => {
        const commentDoc = await getDoc(commentRef);
        commentData = commentDoc.data();

        // Check if the user has already liked the comment
        const likesQuery = query(collection(db, 'commentLikes'), where('commentId', '==', commentId), where('userId', '==', user.uid));
        const likesSnapshot = await getDocs(likesQuery);
        const hasLiked = !likesSnapshot.empty;

        if (hasLiked) {
          // User has already liked, so unlike
          await deleteDoc(likesSnapshot.docs[0].ref);
          transaction.update(commentRef, {
            likes: Math.max(commentData.likes - 1, 0),
            isLiked: false,
          });
        } else {
          // User has not liked, so like
          await addDoc(collection(db, 'commentLikes'), {
            commentId: commentId,
            userId: user.uid,
          });
          transaction.update(commentRef, {
            likes: commentData.likes + 1,
            isLiked: true,
          });
        }
      });

      // Update local state after a successful like operation
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likes: commentData.isLiked ? commentData.likes - 1 : commentData.likes + 1,
                isLiked: !commentData.isLiked,
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error updating like: ', error);
      toast.error('Error updating like. Please try again.');
    }
  };



  const isOlderThanADay = (date) => {
    const now = new Date();
    const diffInMilliseconds = now - date;
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    return diffInDays >= 1;
  };

  return (
    <Dialog
      open={Boolean(post)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ style: { backgroundColor: '#000', color: '#fff', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)' } }}
    >
      {post && (
        <>
          <DialogTitle>
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {post.image && <img src={post.image} alt="Post" style={{ maxWidth: '100%', maxHeight: '400px', marginBottom: '16px' }} />}
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <p>
              {createdAt instanceof Date
                ? `Created at: ${
                    isOlderThanADay(createdAt)
                      ? createdAt.toLocaleDateString()
                      : createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }`
                : 'Invalid date'}
            </p>

            <div style={{ flex: 1, marginLeft: '16px' }}>
              <TextField
                label="Add a comment"
                variant="outlined"
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={2}
                style={{ borderRadius: '12px', marginBottom: '8px' }}
              />
              <Button variant="contained" color="primary" onClick={handleComment} style={{ borderRadius: '12px', padding: '8px 16px' }}>
                Comment
              </Button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h3>Comments</h3>
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onLike={() => handleLike(comment.id)}
                />
              ))}
            </div>
          </DialogContent>
        </>
      )}

      <ToastContainer position="top-right" limit={5} autoClose={5000} theme="dark" />
    </Dialog>
  );
};

export default PostDetails;
