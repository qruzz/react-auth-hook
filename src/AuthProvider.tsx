import React, { useEffect } from 'react';
import Auth0 from 'auth0-js';
import { useImmerReducer } from 'use-immer';
import { authReducer, AuthState, AuthAction } from './authReducer';
import { handleAuthResult } from './useAuth';

export interface AuthContext {
	state: AuthState;
	dispatch: React.Dispatch<AuthAction>;
	auth0Client: Auth0.WebAuth;
	callbackDomain: string;
	navigate: any;
}

export const AuthContext = React.createContext<AuthContext>({} as AuthContext);

export interface AuthProvider {
	auth0Domain: string;
	auth0ClientId: string;
	navigate: any;
	children: React.ReactNode;
}

export function AuthProvider({
	auth0Domain,
	auth0ClientId,
	navigate,
	children,
}: AuthProvider) {
	// Holds the initial entry point URL to the page
	const callbackDomain = window
		? `${window.location.protocol}//${window.location.host}`
		: 'http://localhost:3000';

	const auth0Client = new Auth0.WebAuth({
		domain: auth0Domain,
		clientID: auth0ClientId,
		redirectUri: `${callbackDomain}/auth_callback`,
		audience: `https://${auth0Domain}/api/v2/`,
		responseType: 'token id_token',
		scope: 'openid profile email',
	});

	// Reducer for containing the authentication state
	const [state, dispatch] = useImmerReducer<AuthState, AuthAction>(
		authReducer,
		{
			user: null,
			authResult: null,
			expiresOn: null,
		}
	);

	const [contextValue, setContextValue] = React.useState<AuthContext>({
		state,
		dispatch,
		auth0Client,
		callbackDomain,
		navigate,
	});

	// Lift the context value into the parent's state to avoid triggering
	// unintentional renders in the consumers
	useEffect(() => {
		setContextValue({ ...contextValue, state });
	}, [state]);

	// Check the session to see if a user is authenticated on mount
	useEffect(() => {
		auth0Client.checkSession({}, (error, authResult) => {
			if (error) {
				dispatch({
					type: 'AUTH_ERROR',
					errorType: 'checkSession',
					error,
				});
			} else {
				handleAuthResult({ dispatch, auth0Client, authResult });
			}
		});
	}, []);

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
}
