import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import App from './App';
import { hydrateRefreshTokenFromNative } from './auth/refreshTokenStorage';

async function bootstrap() {
  await hydrateRefreshTokenFromNative();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
