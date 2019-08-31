import { Draft } from 'immer';
import { Auth0Error, Auth0UserProfile, Auth0DecodedHash } from 'auth0-js';

export type Maybe<T> = T | null;

export type AuthState = {
	user: Maybe<Auth0UserProfile>;
	authResult: Maybe<Auth0DecodedHash>;
	expiresOn: Maybe<number>;
};

export type AuthAction =
	| { type: 'LOGIN_USER'; user: Auth0UserProfile; authResult: Auth0DecodedHash }
	| { type: 'LOGOUT_USER' }
	| { type: 'AUTH_ERROR'; errorType: string; error: Error | Auth0Error };

export function authReducer(state: Draft<AuthState>, action: AuthAction) {
	switch (action.type) {
		case 'LOGIN_USER':
			const { authResult, user } = action;

			// The time at which the user session expires
			const expiresOn = authResult.expiresIn
				? authResult.expiresIn * 1000 + new Date().getTime()
				: null;

			if (localStorage) {
				localStorage.setItem('EXPIRES_ON', JSON.stringify(expiresOn));
				localStorage.setItem('AUTH0_USER', JSON.stringify(user));
			}

			return {
				user,
				expiresOn,
				authResult,
			};
		case 'LOGOUT_USER':
			if (localStorage) {
				localStorage.removeItem('EXPIRES_ON');
				localStorage.removeItem('AUTH0_USER');
			}
			return {
				user: null,
				expiresOn: null,
				authResult: null,
			};
		case 'AUTH_ERROR':
			const { errorType, error } = action;
			// TODO: There seems to be errors here even when things work as expected
			// TODO: Should look into that and try to fix
			return {
				user: null,
				expiresOn: null,
				authResult: null,
				errorType,
				error,
			};
		default:
			return state;
	}
}
