export function getBaseUrl() {
	// Use relative /api so Vite proxy (dev) or same server (prod) handles it — local only, no cloud URLs
	if (import.meta.env.PROD) {
		return '/api';
	}
	// Local dev: use proxy so client talks to Vite (same origin); set VITE_API_URL only if backend is elsewhere
	const baseUrl = import.meta.env.VITE_API_URL || '';
	return baseUrl ? `${baseUrl}/api` : '/api';
}

export function getToken() {
	return localStorage.getItem('token');
} 