import { Auth0UserProfile } from 'auth0-js';
import { Draft, castDraft } from 'immer';
import { AuthAction, authReducer, AuthState } from '../authReducer';

const testUser: Auth0UserProfile = {
	name: 'test user',
	user_id: 'user_id',
	nickname: 'test user',
	picture: 'picture_url',
	sub: 'sub',
	clientID: 'client_id',
	updated_at: 'updated_at',
	created_at: 'created_at',
	identities: [],
};

const EXPIRE_TIME = 500;

describe('authReducer', () => {
	describe('handle login', () => {
		beforeEach(() => {
			localStorage.removeItem('react-auth-hook:EXPIRES_ON');
			localStorage.removeItem('react-auth-hook:AUTH0_USER');
			localStorage.removeItem('react-auth-hook:AUTH0_RESULT');
		});

		const now = new Date().getTime();

		const state: Draft<AuthState> = castDraft({
			user: null,
			expiresOn: null,
			authResult: null,
		});

		const action: AuthAction = {
			type: 'LOGIN_USER',
			user: testUser,
			authResult: { accessToken: 'login_access_token', expiresIn: EXPIRE_TIME },
		};

		it('sets the user in state', () => {
			expect(authReducer(state, action).user).toEqual(action.user);
		});

		it('sets the expiresOn in state', () => {
			expect(authReducer(state, action).expiresOn).toBeGreaterThanOrEqual(
				now + EXPIRE_TIME * 1000
			);
		});

		it('sets authResult in state', () => {
			expect(authReducer(state, action).authResult).toEqual(action.authResult);
		});

		it('stores user in local storage', () => {
			authReducer(state, action);

			expect(
				JSON.parse(localStorage.getItem('react-auth-hook:EXPIRES_ON')!)
			).toBeGreaterThanOrEqual(now + EXPIRE_TIME * 1000);

			expect(localStorage.getItem('react-auth-hook:AUTH0_USER')).toEqual(
				JSON.stringify(action.user)
			);
			expect(localStorage.getItem('react-auth-hook:AUTH0_RESULT')).toBeNull();
		});

		it('stores authResult if shouldStoreResult is true', () => {
			const action: AuthAction = {
				type: 'LOGIN_USER',
				user: testUser,
				authResult: {
					accessToken: 'login_access_token',
					expiresIn: EXPIRE_TIME,
				},
				shouldStoreResult: true,
			};

			authReducer(state, action);

			expect(
				JSON.parse(localStorage.getItem('react-auth-hook:EXPIRES_ON')!)
			).toBeGreaterThanOrEqual(now + EXPIRE_TIME * 1000);

			expect(localStorage.getItem('react-auth-hook:AUTH0_USER')).toEqual(
				JSON.stringify(action.user)
			);
			expect(localStorage.getItem('react-auth-hook:AUTH0_RESULT')).toEqual(
				JSON.stringify(action.authResult)
			);
		});
	});

	describe('handle logout', () => {
		const state: Draft<AuthState> = castDraft({
			user: testUser,
			expiresOn: new Date().getTime(),
			authResult: { accessToken: 'login_access_token', expiresIn: EXPIRE_TIME },
		});

		const action: AuthAction = { type: 'LOGOUT_USER' };

		it('clears user in state', () => {
			expect(authReducer(state, action).user).toBeNull();
		});

		it('clears expiresOn in state', () => {
			expect(authReducer(state, action).expiresOn).toBeNull();
		});

		it('clears authResult in state', () => {
			expect(authReducer(state, action).authResult).toBeNull();
		});

		it('removes all auth items from local storage', () => {
			localStorage.setItem(
				'react-auth-hook:EXPIRES_ON',
				JSON.stringify(state.expiresOn)
			);
			localStorage.setItem(
				'react-auth-hook:AUTH0_USER',
				JSON.stringify(state.user)
			);
			localStorage.setItem(
				'react-auth-hook:AUTH0_RESULT',
				JSON.stringify(state.authResult)
			);

			authReducer(state, action);

			expect(
				JSON.parse(localStorage.getItem('react-auth-hook:EXPIRES_ON')!)
			).toBeNull();

			expect(localStorage.getItem('react-auth-hook:AUTH0_USER')).toBeNull();
			expect(localStorage.getItem('react-auth-hook:AUTH0_RESULT')).toBeNull();
		});
	});

	describe('handles errors', () => {
		const state: Draft<AuthState> = castDraft({
			user: testUser,
			expiresOn: new Date().getTime(),
			authResult: { accessToken: 'login_access_token', expiresIn: EXPIRE_TIME },
		});

		const action: AuthAction = {
			type: 'AUTH_ERROR',
			errorType: 'test_error',
			error: new Error(),
		};

		it('sets the error type in state', () => {
			expect(authReducer(state, action).errorType).toBe('test_error');
		});
		it('sets the error type in state', () => {
			expect(authReducer(state, action).error).toBeDefined();
		});
		it('clears user in state', () => {
			expect(authReducer(state, action).user).toBeNull();
		});

		it('clears expiresOn in state', () => {
			expect(authReducer(state, action).expiresOn).toBeNull();
		});

		it('clears authResult in state', () => {
			expect(authReducer(state, action).authResult).toBeNull();
		});
	});
});
