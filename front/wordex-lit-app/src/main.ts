import { Router } from '@vaadin/router';

// Core Shell and Views
import './wordex-app';
import './views/wordex-login-view';
import './views/wordex-register-view';
import './views/wordex-home';
import './views/wordex-dashboard-view';
import './views/wordex-tracer-view';
import './views/wordex-agents-view';
import './views/wordex-slides-view';

import './views/wordex-registry-view';
import './views/wordex-sheet-view';
import './views/wordex-settings-view';
import './views/wordex-service-view';

import './views/wordex-audio-view';
import './views/wordex-analytics-view';
import './views/wordex-gantt-view';
import './views/wordex-webhooks-view';
import './views/wordex-desktop-view';
import './views/wordex-office-clone-view';
import './views/wordex-billing-view';
import './views/wordex-search-view';
import './views/wordex-organisations-view';

// Initialize router on the root element
const initRouter = () => {
  const root = document.getElementById('app-root');
  if (!root) {
    console.error("CRITICAL: #app-root not found in DOM.");
    return;
  }
  
  const router = new Router(root);
  
  router.setRoutes([
    {
      path: '/login',
      component: 'wordex-login-view'
    },
    {
      path: '/register',
      component: 'wordex-register-view'
    },
    {
      path: '/',
      component: 'wordex-app',
      children: [
        { path: '', component: 'wordex-home' },
        { path: 'dashboard', component: 'wordex-dashboard-view' },
        { path: 'registry', component: 'wordex-registry-view' },
        { path: 'agents', component: 'wordex-agents-view' },
        { path: 'analytics', component: 'wordex-analytics-view' },
        { path: 'slides', component: 'wordex-slides-view' },
        { path: 'sheets', component: 'wordex-sheet-view' },
        { path: 'audio', component: 'wordex-audio-view' },
        { path: 'webhooks', component: 'wordex-webhooks-view' },
        { path: 'tracer', component: 'wordex-tracer-view' },
        { path: 'gantt', component: 'wordex-gantt-view' },
        { path: 'settings', component: 'wordex-settings-view' },
        { path: 'documents', component: 'wordex-registry-view' },
        { path: 'folders', component: 'wordex-registry-view' },
        { path: 'desktop', component: 'wordex-desktop-view' },
        { path: 'office', component: 'wordex-office-clone-view' },
        { path: 'billing', component: 'wordex-billing-view' },
        { path: 'search', component: 'wordex-search-view' },
        { path: 'organisations', component: 'wordex-organisations-view' },
        // Fallback for all other paths
        { path: '(.*)', component: 'wordex-service-view' },
      ]
    },
    {
      path: '(.*)',
      component: 'wordex-service-view'
    }
  ]);
};

// Execute immediately since module scripts run after DOM is ready
initRouter();
