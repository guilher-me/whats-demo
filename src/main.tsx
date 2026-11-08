import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ThemeProvider } from './features/theme/Theme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/theme.css';
import './styles/editor.css';
import './styles/conversation.css';
import './styles/flows.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

import './styles/controls.css';

import './styles/playback.css';

import './styles/recording.css';

import './styles/editor-product.css';

import './styles/sharing.css';
import './styles/attachments.css';
import './styles/workspace.css';
import './styles/json-editor.css';
import './styles/commerce.css';

import './styles/business-avatar.css';
