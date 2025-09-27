export function getBaseUrl() {
	// Use environment variable if available, otherwise fallback to localhost
	const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL;
	if (apiUrl) {
		return `${apiUrl}/api`;
	}
	return 'http://localhost:4000/api';
}

export function getToken() {
	return localStorage.getItem('token');
} 