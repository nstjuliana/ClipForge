/**
 * React Renderer Entry Point
 * 
 * Initializes the React application in the Electron renderer process.
 * Renders the root App component and sets up the React DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * Create root element and render the App component.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

