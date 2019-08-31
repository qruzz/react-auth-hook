import React from 'react';
import logo from './logo.svg';
import { useAuth } from 'react-auth-hook';
import './App.css';
import { RouteComponentProps } from '@reach/router';

function App({ location }: RouteComponentProps) {
	const { login, logout, isAuthenticated, user } = useAuth();

	React.useEffect(() => {
		localStorage.setItem(
			'ORIGIN',
			`${window.location.href.replace(window.location.origin, '')}`
		);
	}, []);

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<p>Hey {isAuthenticated() ? user && user.name : 'you!'}</p>
				{isAuthenticated() ? (
					<button onClick={logout}>Log out</button>
				) : (
					<button onClick={login}>Log in</button>
				)}
			</header>
		</div>
	);
}

export default App;
