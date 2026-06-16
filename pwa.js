if ('serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			const registration = await navigator.serviceWorker.register('service-worker.js');
			console.log('Service Worker registrado com sucesso.', registration.scope);
			if (registration.waiting) {
				console.log('Service Worker pronto para ativar.');
			}
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						console.log('Service Worker state:', newWorker.state);
					});
				}
			});
			registration.update();
		} catch (error) {
			console.error('Falha ao registrar Service Worker:', error);
		}
	});
}
