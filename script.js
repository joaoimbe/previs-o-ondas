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
	surfCondition: document.querySelector('#condicaoSurf'),
	waveHeight: document.querySelector('#wave-height'),
	waveTrend: document.querySelector('#wave-trend'),
	windSpeed: document.querySelector('#wind-speed'),
	windTrend: document.querySelector('#wind-trend'),
	period: document.querySelector('#wave-period'),
	waterTemp: document.querySelector('#water-temp'),
	airTemp: document.querySelector('#air-temp'),
	windDirection: document.querySelector('#wind-direction'),
	swellDirection: document.querySelector('#swell-direction'),
	tide: document.querySelector('#tide'),
	tideChart: document.querySelector('#tide-chart'),
};

let tideChart = null;

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
	return `https://marine-api.open-meteo.com/v1/marine?latitude=${location.latitude}&longitude=${location.longitude}&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature,sea_level_height_msl&timezone=America/Sao_Paulo`;
}

function getWindForecastUrl(location) {
	return `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,windspeed_10m,winddirection_10m&timezone=America/Sao_Paulo`;
}

function getNearestTimeIndex(hourly) {
	const now = new Date();
	const times = hourly?.time || [];

	for (let i = 0; i < times.length; i += 1) {
		const forecastTime = new Date(times[i]);
		if (forecastTime.getTime() >= now.getTime()) {
			return i;
		}
	}

	return Math.max(times.length - 1, 0);
}

function classificarSurf(waveHeight, windSpeed) {
	if (waveHeight == null || windSpeed == null) {
		return {
			texto: 'Dados insuficientes',
			classe: 'indefinido',
		};
	}

	if (waveHeight >= 1.2 && waveHeight <= 2.5 && windSpeed < 15) {
		return {
			texto: '🟢 Excelente',
			classe: 'excelente',
		};
	}

	if (waveHeight >= 0.7 && windSpeed < 25) {
		return {
			texto: '🟡 Regular',
			classe: 'regular',
		};
	}

	return {
		texto: '🔴 Ruim',
		classe: 'ruim',
	};
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

function formatTemperatureValue(value) {
	return value == null ? '—' : `${value.toFixed(1)} °C`;
}

function formatDirectionValue(value) {
	if (value == null) {
		return '—';
	}

	const directions = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'];
	const normalized = ((Math.round(value) % 360) + 360) % 360;
	const index = Math.round(normalized / 45) % directions.length;
	return `${directions[index]} (${normalized}°)`;
}

function getTrend(currentValue, previousValue, threshold = 0) {
	if (currentValue == null || previousValue == null) {
		return {
			label: 'Tendência: —',
			className: 'is-neutral',
		};
	}

	const delta = currentValue - previousValue;

	if (delta > threshold) {
		return {
			label: '▲ subindo',
			className: 'is-up',
		};
	}

	if (delta < -threshold) {
		return {
			label: '▼ caindo',
			className: 'is-down',
		};
	}

	return {
		label: '● estável',
		className: 'is-neutral',
	};
}

function formatChartTime(value) {
	return new Date(value).toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function updateTideChart(marineHourly, currentIndex) {
	if (!forecastElements.tideChart || typeof Chart === 'undefined') {
		return;
	}

	const times = marineHourly?.time || [];
	const tideValues = marineHourly?.sea_level_height_msl || [];
	const isCompactView = window.matchMedia('(max-width: 520px)').matches;
	const labelStep = isCompactView ? 4 : 2;

	if (!times.length || !tideValues.length) {
		return;
	}

	const startIndex = Math.max(0, currentIndex - 3);
	const endIndex = Math.min(times.length, startIndex + 10);
	const labels = times.slice(startIndex, endIndex).map(formatChartTime);
	const values = tideValues.slice(startIndex, endIndex);

	if (tideChart) {
		tideChart.data.labels = labels;
		tideChart.data.datasets[0].data = values;
		tideChart.update();
		return;
	}

	const context = forecastElements.tideChart.getContext('2d');
	if (!context) {
		return;
	}

	tideChart = new Chart(context, {
		type: 'line',
		data: {
			labels,
			datasets: [{
				data: values,
				borderColor: '#7fdcff',
				backgroundColor: 'rgba(127, 220, 255, 0.16)',
				fill: true,
				pointRadius: 0,
				borderWidth: 2,
				tension: 0.35,
			}],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					callbacks: {
						label(context) {
							return `${Number(context.parsed.y).toFixed(2)} m`;
						},
					},
				},
			},
			scales: {
				x: {
					ticks: {
						color: '#c2cfda',
						autoSkip: true,
						maxRotation: 0,
						minRotation: 0,
						font: {
							size: isCompactView ? 9 : 11,
						},
						callback(value, index) {
							return index % labelStep === 0 || index === labels.length - 1 ? labels[index] : '';
						},
					},
					grid: {
						display: false,
						offset: false,
					},
				},
				y: {
					ticks: {
						color: '#c2cfda',
						callback(value) {
							return `${Number(value).toFixed(isCompactView ? 2 : 1)} m`;
						},
						font: {
							size: isCompactView ? 9 : 11,
						},
					},
					grid: {
						color: 'rgba(255, 255, 255, 0.08)',
					},
				},
			},
		},
	});
}

function updateForecastDisplay(
	locationLabel,
	waveHeight,
	previousWaveHeight,
	windSpeed,
	previousWindSpeed,
	period,
	waterTemp,
	airTemp,
	windDirection,
	swellDirection,
	tide,
	forecastTime,
) {
	const formattedTime = forecastTime
		? new Date(forecastTime).toLocaleString('pt-BR', {
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
	forecastElements.waterTemp.textContent = formatTemperatureValue(waterTemp);
	if (forecastElements.airTemp) {
		forecastElements.airTemp.textContent = formatTemperatureValue(airTemp);
	}
	forecastElements.windDirection.textContent = formatDirectionValue(windDirection);
	if (forecastElements.swellDirection) {
		forecastElements.swellDirection.textContent = formatDirectionValue(swellDirection);
	}

	const waveTrend = getTrend(waveHeight, previousWaveHeight, 0.03);
	const windTrend = getTrend(windSpeed, previousWindSpeed, 0.2);

	if (forecastElements.waveTrend) {
		forecastElements.waveTrend.textContent = waveTrend.label;
		forecastElements.waveTrend.className = `forecast-trend ${waveTrend.className}`;
	}

	if (forecastElements.windTrend) {
		forecastElements.windTrend.textContent = windTrend.label;
		forecastElements.windTrend.className = `forecast-trend ${windTrend.className}`;
	}

	if (forecastElements.tide) {
		forecastElements.tide.textContent = formatMeterValue(tide);
	}

	if (forecastElements.surfCondition) {
		const resultado = classificarSurf(waveHeight, windSpeed);
		forecastElements.surfCondition.textContent = resultado.texto;
		forecastElements.surfCondition.className = `surf-condition ${resultado.classe}`;
	}
}

async function loadForecast(location = defaultLocation) {
	if (!forecastElements.status) {
		return;
	}

	forecastElements.status.textContent = `Carregando previsão de ${location.label}...`;

	try {
		const [marineResponse, windResponse] = await Promise.all([
			fetch(getForecastUrl(location)),
			fetch(getWindForecastUrl(location)),
		]);

		if (!marineResponse.ok) {
			throw new Error(`Erro ao obter previsão do mar: ${marineResponse.status}`);
		}
		if (!windResponse.ok) {
			throw new Error(`Erro ao obter previsão do vento: ${windResponse.status}`);
		}

		const marineData = await marineResponse.json();
		const windData = await windResponse.json();
		const marineHourly = marineData.hourly || {};
		const windHourly = windData.hourly || {};
		const index = getNearestTimeIndex(marineHourly);
		const previousIndex = Math.max(index - 1, 0);

		updateForecastDisplay(
			location.label,
			marineHourly.wave_height?.[index] ?? null,
			marineHourly.wave_height?.[previousIndex] ?? null,
			windHourly.windspeed_10m?.[index] ?? null,
			windHourly.windspeed_10m?.[previousIndex] ?? null,
			marineHourly.wave_period?.[index] ?? null,
			marineHourly.sea_surface_temperature?.[index] ?? null,
			windHourly.temperature_2m?.[index] ?? null,
			windHourly.winddirection_10m?.[index] ?? null,
			marineHourly.wave_direction?.[index] ?? null,
			marineHourly.sea_level_height_msl?.[index] ?? null,
			marineHourly.time?.[index] ?? null,
		);

		updateTideChart(marineHourly, index);
	} catch (error) {
		forecastElements.status.textContent = 'Falha ao carregar a previsão. Verifique sua conexão.';
		console.error(error);
	}
}

searchForm.addEventListener('submit', redirectIfSurfBeach);
searchInput.addEventListener('change', redirectIfSurfBeach);

loadForecast();
