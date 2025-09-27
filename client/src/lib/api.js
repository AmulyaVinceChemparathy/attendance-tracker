import { getBaseUrl, getToken } from './env.js';

export async function api(path, { method = 'GET', body } = {}) {
	const headers = { 'Content-Type': 'application/json' };
	const token = getToken();
	if (token) headers['Authorization'] = `Bearer ${token}`;
	const res = await fetch(`${getBaseUrl()}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
	
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
		return text ? JSON.parse(text) : {};
	}
	
	return {};
} 