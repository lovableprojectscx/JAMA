import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './panel/panel.css';
import App from './App.jsx';
import PanelApp from './panel/PanelApp.jsx';

const esPanel = window.location.pathname.startsWith('/panel');

createRoot(document.getElementById('root')).render(
  <StrictMode>{esPanel ? <PanelApp /> : <App />}</StrictMode>
);
