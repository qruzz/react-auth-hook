import React from 'react';
import Auth0, {
	Auth0Error,
	Auth0DecodedHash,
	Auth0UserProfile,
} from 'auth0-js';
import { AuthAction, Maybe } from './authReducer';
import { AuthContext } from './AuthProvider';

export interface SetAuthSessionOptions extends HandleAuthTokenOptions {
	authResult: Auth0DecodedHash;
}

export interface HandleAuthTokenOptions {
	dispatch: React.Dispatch<AuthAction>;
	error?: Maybe<Auth0Error | Auth0.Auth0ParseHashError>;
	auth0Client: Auth0.WebAuth;
	authResult: Maybe<Auth0DecodedHash>;
}

export type AuthResult = {
	accessToken: string;
	expiresIn: number;
	idToken: string;
};

export function useAuth() {
	const {
		state,
		dispatch,
		auth0Client,
		callbackDomain,
		navigate,
	} = React.useContext(AuthContext);

	function login() {
		auth0Client.authorize();
	}

	function logout() {
		auth0Client.logout({ returnTo: callbackDomain });
		dispatch({ type: 'LOGOUT_USER' });
		navigate('/');
	}

	function handleAuth(returnRoute: string = '/') {
		if (window) {
			auth0Client.parseHash(async (error, authResult) => {
				await handleAuthResult({ error, auth0Client, authResult, dispatch });

				navigate(returnRoute);
			});
		}
	}

	function isAuthenticated() {
		return state.expiresOn ? new Date().getTime() < state.expiresOn : false;
	}

	return {
		user: state.user,
		authResult: state.authResult,
		isAuthenticated,
		login,
		logout,
		handleAuth,
	};
}

export async function handleAuthResult({
	dispatch,
	auth0Client,
	error,
	authResult,
}: HandleAuthTokenOptions) {
	if (authResult && authResult.accessToken && authResult.idToken) {
		await setAuthSession({ dispatch, auth0Client, authResult });

		return true;
	} else if (error) {
		dispatch({
			type: 'AUTH_ERROR',
			errorType: 'handleAuthResult',
			error,
		});

		return false;
	}
}

async function setAuthSession({
	dispatch,
	auth0Client,
	authResult,
}: SetAuthSessionOptions) {
	return new Promise((resolve: (user: Auth0UserProfile) => void, reject) => {
		if (authResult.accessToken) {
			auth0Client.client.userInfo(authResult.accessToken, (error, user) => {
				if (error) {
					dispatch({
						type: 'AUTH_ERROR',
						errorType: 'userInfo',
						error,
					});
					reject(error);
				} else {
					dispatch({
						type: 'LOGIN_USER',
						authResult,
						user,
					});
					resolve(user);
				}
			});
		}
	});
}
