import { authService, API_BASE } from './auth-service';

/**
 * Custom fetch wrapper that automatically injects the auth token
 * and handles generic errors (like 401 Unauthorized for global logout).
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('wordex_token');
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default content type to JSON if not specified and body is stringified JSON
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  let response: Response;
  
  try {
    response = await fetch(url, config);
  } catch (e) {
    console.warn("Network error, returning empty mock response", e);
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Handle case where Vite serves index.html (starting with <) instead of JSON
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    console.warn("Backend unavailable (got HTML), returning empty mock array.");
    return new Response(JSON.stringify([]), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // Global 401 handler with automatic refresh
  if (response.status === 401) {
    const refreshed = await authService.refresh();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${authService.token}`);
      response = await fetch(url, { ...config, headers });
      if (response.ok) return response;
    }
    
    authService.logout();
    throw new Error('Session expirée ou non autorisée.');
  }

  return response;
}
