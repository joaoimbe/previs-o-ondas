const searchForm = document.querySelector('.search-container');
const searchInput = document.querySelector('#busca-local');

const surfviewUrl = 'https://www.surfview.com.br/';
const beachKeywords = [
	'praia do rosa',
	'guarda do embaú',
	'joaquina',
	'campeche',
	'ferrugem',
	'mole',
	'imbé',
	'tramandaí',
	'capão da canoa',
	'torres',
];

function normalizeText(value) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

function shouldRedirectToSurfview(query) {
	const normalizedQuery = normalizeText(query);

	if (!normalizedQuery) {
		return false;
	}

	return (
		/(^|\s)(sc|rs)(\s|$)/.test(normalizedQuery) ||
		beachKeywords.some((keyword) => normalizedQuery.includes(normalizeText(keyword)))
	);
}

function redirectIfSurfBeach(event) {
	if (event) {
		event.preventDefault();
	}

	const query = searchInput.value;

	if (shouldRedirectToSurfview(query)) {
		window.location.assign(surfviewUrl);
		return;
	}

	searchInput.focus();
}

searchForm.addEventListener('submit', redirectIfSurfBeach);
searchInput.addEventListener('change', redirectIfSurfBeach);
