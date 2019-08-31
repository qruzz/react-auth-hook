import React from 'react';
import ReactDOM from 'react-dom';
import { AuthProvider, useAuth } from 'react-auth-hook';
import { navigate, Router, RouteComponentProps } from '@reach/router';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './index.css';

type AuthCallback = RouteComponentProps & {
	setOrigin: () => void;
};

function AuthCallback({ location }: RouteComponentProps) {
	const { handleAuth } = useAuth();

	React.useEffect(() => {
		const origin = localStorage.getItem('ORIGIN') || undefined;

		handleAuth(origin);
	}, [handleAuth]);

	return (
		<div
			style={{
				width: '100vw',
				height: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1>You have reached the callback page - you will now be redirected</h1>
		</div>
	);
}

ReactDOM.render(
	<AuthProvider
		navigate={navigate}
		auth0Domain="reactauthhook.eu.auth0.com"
		auth0ClientId="5iK42vpGXdMDbKvW1Gkz3I8D8352vNWa"
	>
		<Router>
			<App default />
			<AuthCallback path="/auth_callback" />
		</Router>
	</AuthProvider>,
	document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
