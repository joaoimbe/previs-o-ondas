const CACHE_NAME = 'previsao-das-ondas-v2';
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

self.addEventListener('fetch', (event) => {
	if (isNetworkFirstRequest(event.request)) {
		event.respondWith(
			fetch(event.request)
				.then((networkResponse) => {
					return networkResponse;
				})
				.catch(() => caches.match(event.request))
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}
			return fetch(event.request).then((networkResponse) => {
				return caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, networkResponse.clone());
					return networkResponse;
				});
			});
		})
	);
});
