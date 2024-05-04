import React, { useState, useEffect } from 'react';
import './YouTubeHome.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import auth from './firebase';
import SideMenu from './side-menu.js';
import Yeets from './yeets.js';
import MenuIcon from '@mui/icons-material/Menu';
import CreateIcon from '@mui/icons-material/Create';
import { IconButton } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import SearchIcon from '@mui/icons-material/Search';
import LoginForm from './LoginForm';
import LoadingScreen from './landscreen.js';
import anime from 'animejs'; // Import anime.js library
import Profile from './side-open/profile';
import More from './side-open/more';
import Test from './side-open/test';
import { db } from './firebase';
import { collection, query, getDocs } from 'firebase/firestore';

function YouTubeHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [user] = useAuthState(auth);
  const [containerVisible, setContainerVisible] = useState(true);
  const [postVisible, setPostVisible] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [open, makeopen] = useState(false); // Change initial state to false for mobile view
  const [selectedMenu, setSelectedMenu] = useState('home');

  useEffect(() => {
    const anim = anime.timeline({
      loop: false,
    });

    anim
      .add({
        targets: '#hexagon path',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutQuart',
        duration: 2000,
        delay: function (el, i) {
          return i * 250;
        },
      })
      .add({
        targets: '#hexagon #B',
        duration: 1000,
        opacity: 1,
        easing: 'easeInOutQuart',
        complete: () => {
          setAnimationComplete(true);
          setContainerVisible(false);
        },
      });

    // Fetch announcements when the component mounts
  }, []);

  const fetchSearchResults = async (searchQuery) => {
    try {
      const q = query(collection(db, 'posts'));
      const querySnapshot = await getDocs(q);
      const searchResults = [];
      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        // Check if the post title contains the search query
        if (postData.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push(postData);
        }
      });
      return searchResults;
    } catch (error) {
      console.error('Error fetching search results:', error);
      return [];
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() !== '') {
      const searchResults = await fetchSearchResults(searchQuery);
      console.log('Search results:', searchResults);
      // Handle displaying the search results in your component
    } else {
      console.log('Search query is empty');
    }
  };

  const toggleContainer = () => {
    if (animationComplete) {
      makeopen(!open);
    }
  };

  const handleCreatePost = () => {
    setOpenDialog(true);
  };

  const handleSignIn = () => {
    setShowLoginForm(true);
  };

  const handleMenuClick = (menuItem) => {
    setSelectedMenu(menuItem);
  };

  return (
    <div className="mobile-container"> {/* Add a wrapper for mobile view */}
      <div id="navbar">
        <div id="left-side">
          <div
            className="svg-wrapper"
            id="hamburger"
            style={{ fontSize: '18px', cursor: 'pointer' }}
            onClick={toggleContainer}
          >
            <MenuIcon />
          </div>
          <span style={{ fontSize: '30px', fontWeight: 'bold', marginLeft: '20px', userSelect: 'none' }}>𝕐</span>
          <div id="search-place" style={{ textAlign: 'center', marginLeft: '20px' }}>
            <input 
              type="text"
              id="search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button id="search-btn" onClick={handleSearch}>
              <SearchIcon style={{ color: '#ffffff', width: '26px', height: 'auto' }} />
            </button>
          </div>
        </div>

        {containerVisible && <LoadingScreen />}

        <div id="right-side" style={{ position: 'absolute', top: '0', right: '0', display: 'flex', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <CreateIcon
              onClick={handleCreatePost}
              style={{
                cursor: 'pointer',
                fontSize: '28px',
                color: '#fff',
                transition: 'transform 0.3s ease-in-out',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            {user ? (
              <div />
            ) : (
              <IconButton onClick={handleSignIn} style={{ color: '#fff', marginRight: '10px' }}>
                <LoginIcon style={{ fontSize: '28px' }} />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      <SideMenu containerVisible={open} handleMenuClick={handleMenuClick} />

      {/* Conditionally render components based on the selected menu item */}
      {selectedMenu === 'home' && (
        <Yeets searchQuery={searchQuery} openDialog={openDialog} setOpenDialog={setOpenDialog} showYeets={() => setPostVisible(true)} />
      )}

      {selectedMenu === 'profile' && <Profile />}
      {selectedMenu === 'more' && <More />}
      {selectedMenu === 'test' && <Test />}

      {/* Render the login form conditionally based on the state */}
      {showLoginForm && <LoginForm setShowLoginForm={setShowLoginForm} />}

      {/* Chat Container */}
      <div></div>
    </div>
  );
}

export default YouTubeHome;
