import { getBaseUrl, getToken } from './env.js';

export async function api(path, { method = 'GET', body } = {}) {
	const headers = { 'Content-Type': 'application/json' };
	const token = getToken();
	console.log('Token from localStorage:', token);
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
		console.log('Authorization header set:', headers['Authorization']);
	} else {
		console.log('No token found, making request without authorization');
	}
	
	const url = `${getBaseUrl()}${path}`;
	console.log(`API call: ${method} ${url}`);
	
	try {
		const res = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
		
		console.log(`API response: ${res.status} ${res.statusText}`);
		
		if (!res.ok) {
			let errorMessage = 'Request failed';
			try {
				const errorData = await res.json();
				errorMessage = errorData.error || errorMessage;
			} catch (e) {
				// If response is not JSON, use status text
				errorMessage = res.statusText || errorMessage;
			}
			throw new Error(errorMessage);
		}
		
		// Check if response has content before trying to parse JSON
		const contentType = res.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			const text = await res.text();
			const data = text ? JSON.parse(text) : {};
			console.log('API response data:', data);
			return data;
		}
		
		return {};
	} catch (error) {
		console.error('API error:', error);
		// Handle network errors (connection refused, CORS, wrong URL)
		if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
			const base = getBaseUrl();
			const hint = base.startsWith('http')
				? ' Check the server is running (e.g. in server/: npm start) and reachable at ' + base.replace('/api', '')
				: ' Check the server is running on port 3000 (e.g. in server/: npm start).';
			throw new Error('Unable to connect to server.' + hint);
		}
		throw error;
	}
} 