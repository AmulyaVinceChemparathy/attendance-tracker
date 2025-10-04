import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => {
		const storedToken = localStorage.getItem('token');
		console.log('Initial token from localStorage:', storedToken ? 'present' : 'none');
		return storedToken;
	});
	
	useEffect(() => {
		if (token) {
			localStorage.setItem('token', token);
			console.log('Token saved to localStorage');
		} else {
			localStorage.removeItem('token');
			console.log('Token removed from localStorage');
		}
	}, [token]);

	// Function to clear token on logout
	const logout = () => {
		console.log('Logging out...');
		setToken(null);
		localStorage.removeItem('token');
	};

	return (
		<AuthContext.Provider value={{ token, setToken, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
} 