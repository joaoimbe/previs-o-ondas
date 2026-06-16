if ('serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			await navigator.serviceWorker.register('service-worker.js');
			console.log('Service Worker registrado com sucesso.');
		} catch (error) {
			console.error('Falha ao registrar Service Worker:', error);
		}
	});
}
