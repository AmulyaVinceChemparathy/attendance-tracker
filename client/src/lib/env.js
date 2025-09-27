export function getBaseUrl() {
	// Use Railway backend URL
	return 'https://tracker-production-bc3f.up.railway.app/api';
}

export function getToken() {
	return localStorage.getItem('token');
} 