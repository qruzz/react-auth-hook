<div align="center">
  <h1>react-auth-hook</h1>
  <p>A small library for authenticating users in React using Auth0.</p>
  <img src="https://i.imgur.com/GVgY6Xc.png"/>
  <br />
  <br />
  <img alt="version" src="https://flat.badgen.net/npm/v/react-auth-hook" />
  <img alt="bundle-size" src="https://flat.badgen.net/bundlephobia/min/react-auth-hook?color=cyan" />
  <img alt="licence" src="https://flat.badgen.net/npm/license/react-auth-hook" />
  <br />
  <br />
  <p>If the library has has helped you, please consider giving it a ⭐️</p>
</div>

## Table of Content

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Documentation](#documentation)
  - [`AuthProvider`](#authprovider)
  - [`useAuth`](#useauth)
    - [`login`](#login)
    - [`logout`](#logout)
    - [`handleAuth`](#handleauth)
    - [`isAuthenticated`](#isauthenticated)
    - [`user`](#user)
    - [`authResult`](#authresult)
- [Issues](#issues)

## Getting Started

This module is distributed with [npm](https://www.npmjs.com) which is bundled with [node](https://nodejs.org) and should be installed as one of your projects `dependencies`:

```shell
npm install --save react-auth-hook
```

or using [yarn](https://yarnpkg.com)

```shell
yarn add react-auth-hook
```

This library includes `auth0-js` as a `dependency` and requires `react` as a `peerDependency`.

<hr />

You can find a simple example of a react application with typescript in the [examples](https://github.com/qruzz/react-auth-hook/tree/master/examples) folder in this repository.

### Configuring Auth0

`react-auth-hook` is designed to be quick to setup and easy to use. All it requires is a [Auth0](https://auth0.com/) account with a application set up.

There are a few required configurations to be done in your Auth0 application to make `react-auth-hook` work properly.

#### Allowed Callback URLs

To route back a user after she is authenticated you need to supply a list of URLs that are considered valid. This means that you should add all the URLs which you be authenticating your users from.

![](https://i.imgur.com/0k1rWSB.png)

#### Allowed Web Origins

To allow origins for use with Cross-Origin Authentication you should supply a list of URLs that the authentication request will come from.

![](https://i.imgur.com/elsFn7V.png)

#### Allowed Logout URLs

After logging out your users will need to be redirected back from Auth0. Provide a list of valid URLs that Auth- can redirect them to with the `returnTo` query parameter.

![](https://i.imgur.com/3qk7PzU.png)

## Usage

To use this library and the `useAuth` hook, you first need to wrap you application in an `AuthProvider` component to configure the Auth0 client and share state between components.

### 1. Configure `AuthProvider`

In your application, wrap the parts you want to be "hidden" behind your authentication layer in the `AuthProvider` component. I recommend adding it around your root component in the `index.js` file (in React).

```js
// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom';
import { navigate } from '@reach/router';
import { AuthProvider } from 'react-auth-hook';

ReactDOM.render(
	<AuthProvider
		auth0Domain="reactauthhook.eu.auth0.com"
		auth0ClientId="5iK42vpGXdMDbKvW1Gkz3I8D8352vNWa"
		navigate={navigate}
	>
		<App />
	</AuthProvider>,
	document.getElementById('root')
);
```

The `AuthProvider` create the context, sets up an immutable state reducer, and instantiates the Auth0 client.

### 2. Handle the Callback

Auth0 use [OAuth](https://oauth.net/2/) which required you to redirect your users to their login form. After the user has then been authenticated, the provider will redirect the user back to your application.

The simplest way to handle the callback is to create a page for it:

```js
// src/components/AuthCallback

import React from 'react';
import { RouteComponentProps } from '@reach/router';
import { useAuth } from 'react-auth-hook';

export function AuthCallback(props: RouteComponentProps) {
	const { handleAuth } = useAuth();

	React.useEffect(() => {
		handleAuth();
	}, []);

	return (
		<>
			<h1>You have reached the callback page</h1>
			<h2>you will now be redirected</h2>
		</>
	);
}
```

The purpose of this page is to show some "loading" state and then run the `handleAuth` method from `useAuth` on page load. The function will automatically redirect the user to the root route (`/`).

## Documentation

### `AuthProvider`

The `AuthProvider` component implements the `AuthProvider` interface and takes a number of props to initialise the Auth0 client and more.

```ts
interface AuthProvider {
	auth0Domain: string;
	auth0ClientId: string;
	navigate: any;
	children: React.ReactNode;
}
```

As can be seen from the type interface, the `AuthProvider` API takes a couple of configuration options:

- `auth0Domain` _the auth domain from your Auth0 application_
- `auth0ClientId` _the client id from your Auth0 application_
- `navigate` _your routers navigation function used for redirects_

#### Default Auth0 Configuration

`react-auth-hook` infers and sets a few defaults for the configuration parameters required by `auth0-js`:

```ts
// AuthProvider.tsx

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
```

The `domain` and `clientID` comes from the `AuthProvider` props.

The `redirectUri` is configured to use the `/auth_callback` page on the current domain which is inferred automatically as can be seen above. Auth0 redirect your users to this page after login so you can set initialise the user session. `useAuth` handles all this for you.

The `audience` is used for requesting API access and is set to `v2` of the Auth0 API by default.

The `responseType` specifies which response we want back from the Auth0 API, here being the `token` and `id_token`.

The `scope` is set here is the default in `auth0-js` as of version 9. It specifies what user resources you will gain access to on successful authentication.

### `useAuth`

The `useAuth` hook implements the `UseAuth` interface and exposes a number of functions and data objects.

```ts
interface UseAuth {
	login: () => void;
	logout: () => void;
	handleAuth: (returnRoute?: string) => void;
	isAuthenticated: () => boolean;
	user: Auth0.Auth0UserProfile | null;
	authResult: Auth0.Auth0DecodedHash | null;
}
```

#### `login`

The `login` function calls the `authorize` function from Auth0 and redirects the user to the Auth0 hosted login page (`/authorize`) in order to initialize a new authN/authZ transaction using the [Universal Login]().

#### `logout`

The `logout` function calls the similarly named function from Auth0. After a successful logout, the users will be routed to the some-domain URLs that you whitelisted in the Auth0 configuration step.

#### `handleAuth`

The `handleAuth` function takes care of - as the name suggests - handling the authentication. The method will create a cookie in local storage with your user's information and redirect back to the homepage (`/`) by default.

If your users have navigated directly to a nested route within your site, you are probably going to want to redirect them back to that route. Ro redirect to a route other than the homepage, supply the `returnRoute` argument with the associated route. For example, to dynamically redirect to a nested route after authentication, call `handleAuth` like so:

```js
handleAuth(window.location.href.replace(window.location.origin, ''));
```

#### `isAuthenticated`

The `isAuthenticated` function returns a `boolean` depending on wether the users is authenticated or not. It utilises the expiration time for the auth token provided by `authResult` returned by a successful login. The `useAuth` reducer sets and read this token in `localStorage`.

#### `user`

The `user` object contains the Auth0 user profile returned when the users is successfully authenticated. It implements the `Auth0UserProfile` interface. A detailed description of the interface can be found in the [`auth0-js` types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/auth0-js/index.d.ts?ts=3#L644).

#### `authResult`

The `authResult` object contains the decoded Auth0 hash which is the object returned by the [`parseHash`]() function. It implements the `Auth0DecodedHash` interface. A detailed description of the interface can be found in the [`auth0-js` types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/auth0-js/index.d.ts?ts=3#L594).

## Issues

If any issues occur using this library, please fill our a detailed bug report on [GitHub](https://github.com/qruzz/react-auth-hook/issues).

<!-- If you want to take a stab at solving the issue yourself, check out the [Contributing]() document on how to get started. -->
