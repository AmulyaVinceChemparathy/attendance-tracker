export function getBaseUrl() {
	// In production, use relative URLs since frontend and backend are served from same domain
	if (import.meta.env.PROD) {
		return '/api';
	}
	// Use environment variable or fallback to localhost for development
	const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
	return `${baseUrl}/api`;
}

export function getToken() {
	return localStorage.getItem('token');
} 