// LoadingScreen.js
import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <svg id="hexagon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <g>
          <g id="B" transform="translate(36, 33)" fill="#ffffff" style={{ opacity: 0 }} fontSize="50" fontWeight="400" letterSpacing="4.16666603">
            <text>
              <tspan x="-4.3" y="35">𝕐</tspan>
            </text>
          </g>
          <path
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M 50, 5
               L 11, 27
               L 11, 72
               L 50, 95
               L 89, 73
               L 89, 28 z"
          />
        </g>
      </svg>
    </div>
  );
};

export default LoadingScreen;
