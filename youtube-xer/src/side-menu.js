// side-menu.js
import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

function SideMenu({ containerVisible, handleMenuClick }) {
  return (
    <div id="container" className={containerVisible ? 'visible-container' : 'hidden-container'}>
      <div id="left-side-action">
        <div className="left-side-item" id="home" onClick={() => handleMenuClick('home')}>
          <div>
            <HomeIcon fontSize="large" />
            <p>Home</p>
          </div>
        </div>


        <div className="left-side-item" id="profile" onClick={() => handleMenuClick('profile')}>
          <div>
            <AccountCircleIcon fontSize="large" />
            <p>Profile</p>
          </div>
        </div>

        <div className="left-side-item" id="more" onClick={() => handleMenuClick('more')}>
          <div>
            <MoreHorizIcon fontSize="large" />
            <p>More</p>
          </div>
        </div>


      </div>
    </div>
  );
}

export default SideMenu;
