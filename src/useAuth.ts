import React from 'react';
import Auth0, {
	Auth0Error,
	Auth0DecodedHash,
	Auth0UserProfile,
} from 'auth0-js';
import { AuthAction, Maybe } from './authReducer';
import { AuthContext } from './AuthProvider';

export interface UseAuth {
	login: () => void;
	logout: () => void;
	handleAuth: (returnRoute?: string) => void;
	isAuthenticated: () => boolean;
	user: Maybe<Auth0UserProfile>;
	authResult: Maybe<Auth0DecodedHash>;
}

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

export function useAuth(): UseAuth {
	const {
		state,
		dispatch,
		auth0Client,
		callbackDomain,
		navigate,
	} = React.useContext(AuthContext);

	/**
	 * Use to redirect to the auth0 hosted login page (`/authorize`) in order to
	 * initialize a new authN/authZ transaction
	 *
	 * @example
	 * ```
	 * import { useAuth } from 'react-auth-hook';
	 *
	 * const { login } = useAuth();
	 *
	 * return (
	 * 	<button onClick={login}>Log In</button>
	 * );
	 * ```
	 */
	function login() {
		auth0Client.authorize();
	}

	/**
	 * Use to log out the user and remove the user and token expiration
	 * time from localStorage
	 *
	 * @example
	 * ```
	 * import { logout } from 'react-auth-hook';
	 *
	 * const { logout } = useAuth();
	 *
	 * return (
	 * 	<button onClick={logout}>Log Out</button>
	 * );
	 * ```
	 */
	function logout() {
		auth0Client.logout({ returnTo: callbackDomain });
		dispatch({ type: 'LOGOUT_USER' });
		navigate('/');
	}

	/**
	 * Use to automatically verify that the returned ID Token's nonce claim is
	 * the same as the option. It then logs in the user, setting the user in and
	 * token expiration time in localStorage
	 *
	 * @param {string} returnRoute The route to navigate to after authentication
	 *
	 * @example
	 * ```
	 * import { useAuth } from 'react-auth-hook';
	 *
	 * function AuthCallback() {
	 * 	const { handleAuth } = useAuth();
	 *
	 * 	React.useEffect(() => {
	 * 		const returnRoute = '/some/nested?route';
	 *
	 * 		handleAuth(returnRoute);
	 * 	}, [handleAuth]);
	 *
	 * 	return <p>This is the callback page - redirects to returnRoute
	 * }
	 * ```
	 */
	function handleAuth(returnRoute: string = '/') {
		if (window) {
			auth0Client.parseHash(async (error, authResult) => {
				await handleAuthResult({ error, auth0Client, authResult, dispatch });

				navigate(returnRoute);
			});
		}
	}

	/**
	 * Use to see if the the JWT token has expired, e.g. wether the user
	 * is still authenticated
	 *
	 * @example
	 * ```
	 * import { useAuth } from 'react-auth-hook';
	 *
	 * const { isAuthenticated } = useAuth();
	 *
	 * return isAuthenticated() ? (
	 * 	<p>Welcome logged in user</p>
	 * ) : (
	 * 	<p>Welcome anonymous user</p>
	 * )
	 * ```
	 */
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
