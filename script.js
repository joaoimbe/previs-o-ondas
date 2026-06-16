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

const forecastElements = {
	status: document.querySelector('#forecast-status'),
	waveHeight: document.querySelector('#wave-height'),
	windSpeed: document.querySelector('#wind-speed'),
	period: document.querySelector('#wave-period'),
};

const defaultLocation = {
	label: 'Imbé - RS',
	latitude: -29.99,
	longitude: -50.15,
};

function normalizeText(value) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s]/g, '')
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

function getForecastUrl(location) {
	return `https://marine-api.open-meteo.com/v1/marine?latitude=${location.latitude}&longitude=${location.longitude}&hourly=wave_height,wave_period&timezone=America/Sao_Paulo`;
}

function getWindForecastUrl(location) {
	return `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=windspeed_10m&timezone=America/Sao_Paulo`;
}

function getNearestTimeIndex(hourly) {
	const now = new Date();

	for (let i = 0; i < hourly.time.length; i += 1) {
		const forecastTime = new Date(`${hourly.time[i]}:00`);
		if (forecastTime.getTime() >= now.getTime()) {
			return i;
		}
	}

	return hourly.time.length - 1;
}

function formatMeterValue(value) {
	return value == null ? '—' : `${value.toFixed(2)} m`;
}

function formatWindValue(value) {
	return value == null ? 'Dados de vento indisponíveis' : `${value.toFixed(1)} km/h`;
}

function formatPeriodValue(value) {
	return value == null ? '—' : `${value.toFixed(1)} s`;
}

function updateForecastDisplay(locationLabel, waveHeight, windSpeed, period, forecastTime) {
	const formattedTime = forecastTime
		? new Date(`${forecastTime}:00`).toLocaleString('pt-BR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
		: '—';

	forecastElements.status.textContent = `Previsão real para ${locationLabel} (próximo horário: ${formattedTime})`;
	forecastElements.waveHeight.textContent = formatMeterValue(waveHeight);
	forecastElements.windSpeed.textContent = formatWindValue(windSpeed);
	forecastElements.period.textContent = formatPeriodValue(period);
}

async function loadForecast(location = defaultLocation) {
	if (!forecastElements.status) {
		return;
	}

	forecastElements.status.textContent = `Carregando previsão de ${location.label}...`;

	try {
		const [waveResponse, windResponse] = await Promise.all([
			fetch(getForecastUrl(location)),
			fetch(getWindForecastUrl(location)),
		]);

		if (!waveResponse.ok) {
			throw new Error(`Erro ao obter previsão das ondas: ${waveResponse.status}`);
		}
		if (!windResponse.ok) {
			throw new Error(`Erro ao obter previsão do vento: ${windResponse.status}`);
		}

		const waveData = await waveResponse.json();
		const windData = await windResponse.json();
		const index = getNearestTimeIndex(waveData.hourly);
		const windSpeed = windData.hourly?.windspeed_10m?.[index] ?? null;

		updateForecastDisplay(
			location.label,
			waveData.hourly.wave_height[index],
			windSpeed,
			waveData.hourly.wave_period[index],
			waveData.hourly.time[index],
		);
	} catch (error) {
		forecastElements.status.textContent = 'Falha ao carregar a previsão. Verifique sua conexão.';
		console.error(error);
	}
}

searchForm.addEventListener('submit', redirectIfSurfBeach);
searchInput.addEventListener('change', redirectIfSurfBeach);

loadForecast();
