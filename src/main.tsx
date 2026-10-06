import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Racine } from './Racine';
import './commun/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Racine />
  </StrictMode>,
);
