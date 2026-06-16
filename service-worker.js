const CACHE_NAME = 'previsao-das-ondas-v3';
const ASSETS_TO_CACHE = [
	'.',
	'index.html',
	'style.css',
	'script.js',
	'pwa.js',
	'manifest.json',
	'favicon.ico.ico',
	'logo.png.png',
	'previ.png.jpeg'
];

const NETWORK_FIRST_URLS = [
	'https://marine-api.open-meteo.com/',
	'https://api.open-meteo.com/'
];

const SHELL_NETWORK_FIRST = [
	'/',
	'/index.html',
	'/script.js',
	'/pwa.js',
	'/manifest.json'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
				)
			)
	);
	self.clients.claim();
});

function isNetworkFirstRequest(request) {
	return NETWORK_FIRST_URLS.some((url) => request.url.startsWith(url));
}

function isShellNetworkFirstRequest(request) {
	if (request.method !== 'GET') {
		return false;
	}

	const requestUrl = new URL(request.url);
	if (requestUrl.origin !== self.location.origin) {
		return false;
	}

	return requestUrl.pathname === '/' || SHELL_NETWORK_FIRST.includes(requestUrl.pathname);
}

self.addEventListener('fetch', (event) => {
	const request = event.request;

	if (isNetworkFirstRequest(request) || isShellNetworkFirstRequest(request)) {
		event.respondWith(
			fetch(request)
				.then((networkResponse) => {
					if (request.method === 'GET' && networkResponse.ok) {
						const responseClone = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
					}
					return networkResponse;
				})
				.catch(() => caches.match(request))
		);
		return;
	}

	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}
			return fetch(request).then((networkResponse) => {
				if (request.method === 'GET' && networkResponse.ok) {
					return caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, networkResponse.clone());
						return networkResponse;
					});
				}
				return networkResponse;
			});
		})
	);
});
