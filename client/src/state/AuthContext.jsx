import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBaseUrl } from '../lib/env.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem('token'));
	const [userRole, setUserRole] = useState(null);
	const [roleReady, setRoleReady] = useState(!localStorage.getItem('token'));

	useEffect(() => {
		if (token) {
			localStorage.setItem('token', token);
		} else {
			localStorage.removeItem('token');
			setUserRole(null);
			setRoleReady(true);
		}
	}, [token]);

	useEffect(() => {
		if (!token) {
			return;
		}
		let cancelled = false;
		setRoleReady(false);
		fetch(`${getBaseUrl()}/auth/me`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((r) => (r.ok ? r.json() : Promise.reject(new Error('me'))))
			.then((d) => {
				if (!cancelled) setUserRole(d.user?.role === 'teacher' ? 'teacher' : 'student');
			})
			.catch(() => {
				if (!cancelled) setUserRole('student');
			})
			.finally(() => {
				if (!cancelled) setRoleReady(true);
			});
		return () => {
			cancelled = true;
		};
	}, [token]);

	const logout = () => {
		setToken(null);
		localStorage.removeItem('token');
		setUserRole(null);
		setRoleReady(true);
	};

	return (
		<AuthContext.Provider value={{ token, setToken, logout, userRole, roleReady }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
