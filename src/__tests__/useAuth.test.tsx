import React from 'react';
import Auth0, { Auth0UserProfile } from 'auth0-js';
import { render, fireEvent, screen } from '@testing-library/react';
import { AuthContext } from '../AuthProvider';
import { handleAuthResult, useAuth } from '../useAuth';

const auth0Client = new Auth0.WebAuth({
	domain: 'localhost',
	clientID: '12345',
	redirectUri: 'localhost/auth0_callback',
	audience: 'https://localhost/api/v2/',
	responseType: 'token id_token',
	scope: 'openid profile email',
});

auth0Client.authorize = jest.fn();
auth0Client.logout = jest.fn();

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

const context: AuthContext = {
	state: {
		user: testUser,
		expiresOn: null,
		authResult: null,
	},
	dispatch: jest.fn(),
	auth0Client,
	callbackDomain: 'localhost',
	navigate: jest.fn(),
};

function renderer(context: AuthContext, Mock: React.ElementType) {
	return (
		<AuthContext.Provider value={context}>
			<Mock />
		</AuthContext.Provider>
	);
}

describe('useAuth', () => {
	describe('login', () => {
		const mock = () => {
			const { login } = useAuth();

			return <button onClick={login}>log in</button>;
		};

		it('calls auth0.authorize when triggering login', () => {
			render(renderer(context, mock));
			fireEvent.click(screen.getByText('log in'));
			expect(auth0Client.authorize).toBeCalled();
		});
	});

	describe('logout', () => {
		const mock = () => {
			const { logout } = useAuth();

			return <button onClick={logout}>log out</button>;
		};

		it('calls auth0.logout when triggering logout', () => {
			render(renderer(context, mock));
			fireEvent.click(screen.getByText('log out'));
			expect(auth0Client.logout).toBeCalledWith({
				returnTo: context.callbackDomain,
			});
		});

		it('dispatches LOGOUT_USER action', () => {
			render(renderer(context, mock));
			fireEvent.click(screen.getByText('log out'));
			expect(context.dispatch).toHaveBeenCalledWith({
				type: 'LOGOUT_USER',
			});
		});

		it('navigates to root of callbackDomain', () => {
			render(renderer(context, mock));
			fireEvent.click(screen.getByText('log out'));
			expect(context.navigate).toHaveBeenCalledWith('/');
		});
	});

	describe('handleAuth', () => {
		const mock = (returnRoute?: string) => {
			const { handleAuth } = useAuth();

			React.useEffect(() => {
				handleAuth(returnRoute);
			}, [handleAuth]);

			return <p>this is the callback page - redirects to returnRoute</p>;
		};

		it('navigates to / when no returnRoute is provided', () => {
			render(renderer(context, () => mock()));
			expect(context.navigate).toHaveBeenCalledWith('/');
		});

		// TODO: Fix this, as it seems to still call navigate with '/'
		// it('navigates to the returnRoute when provided', () => {
		//     render(renderer(context, () => mock('/returnRoute')))
		//     expect(context.navigate).toHaveBeenCalledWith('/returnRoute');
		// })
	});

	describe('isAuthenticated', () => {
		const falseMock = () => {
			const { isAuthenticated } = useAuth();
			expect(isAuthenticated()).toBe(false);
			return null;
		};

		const trueMock = () => {
			const { isAuthenticated } = useAuth();
			expect(isAuthenticated()).toBe(true);
			return null;
		};

		it('is false when expiresOn is not set', () => {
			context.state.expiresOn = null;
			render(renderer(context, falseMock));
		});

		it('is false when expiresOn is in the past', () => {
			context.state.expiresOn = new Date().getTime() - 3600 * 1000;
			render(renderer(context, falseMock));
		});

		it('is true expiresOn is in the future', () => {
			context.state.expiresOn = new Date().getTime() + 3600 * 1000;
			render(renderer(context, trueMock));
		});
	});

	describe('handleAuthResult', () => {
		const dispatch = jest.fn((_action: any) => null);

		const authResult = {
			accessToken: '12345',
			idToken: '12345',
		};

		beforeEach(() => {
			// mock auth0.client.userInfo for success
			auth0Client.client.userInfo = jest.fn((_accessToken, callback) =>
				callback(null, testUser)
			);
		});

		describe('on success', () => {
			it('dispatches LOGIN_USER action', async () => {
				await handleAuthResult({ dispatch, authResult, auth0Client });

				expect(dispatch).toHaveBeenCalledWith({
					type: 'LOGIN_USER',
					user: testUser,
					authResult,
					shouldStoreResult: false,
				});
			});

			it('returns true', async () => {
				expect(
					await handleAuthResult({ dispatch, authResult, auth0Client })
				).toBe(true);
			});
		});

		describe('on error', () => {
			const error = (new Error() as unknown) as Auth0.Auth0Error;

			it('dispatches AUTH_ERROR action', async () => {
				await handleAuthResult({
					dispatch,
					authResult: null,
					auth0Client,
					error,
				});

				expect(dispatch).toHaveBeenCalledWith({
					type: 'AUTH_ERROR',
					errorType: 'handleAuthResult',
					error,
				});
			});

			it('returns false', async () => {
				expect(
					await handleAuthResult({
						dispatch,
						authResult: null,
						auth0Client,
						error,
					})
				).toBe(false);
			});
		});
	});
});
