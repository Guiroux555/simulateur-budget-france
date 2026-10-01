import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/retraites/app/App';
import './commun/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
