let currentGraph;
let currentScreen;

$(document).ready(() => {
	Chart.register(ChartDataLabels);
	fetchArtists();
	fetchChartDates();
	getArtistGraph('897d563d-a26d-4561-abfc-c671e9c3db78');
	getTop100('1980-01-05');
});

const clearTitles = () => {
	$('#title').html('');
	$('#subtitle').html('');
}

const handleError = err => {
	console.error(err);
}

const displayGraph = config => {
	$('#content-container').hide();
	if (currentGraph) currentGraph.destroy();
	$('#chartjs-canvas-container').children().remove();
	const canvas = document.createElement('canvas');
	$(canvas).attr('id', 'chartjs-canvas');
	$(canvas).appendTo($('#chartjs-canvas-container'));
	currentGraph = new Chart($('#chartjs-canvas'), config);
	$('#chartjs-canvas-container').show();
};

const getArtistGraph = async artistId => {
	try {
		if (!artistId) return;
		clearTitles();
		currentScreen = 'artist-graph';
		fetch(`/artists/${artistId}/songs`)
		.then(res => {
			if (!res.ok) throw new Error(res.statusText);
			return res.json();
		})
		.then(json => {
			$('#title').html(`${json[0].artist_name}: Chart Performance`);
			const subtitle = (json.length === 1 ? '' : `<div class="bold"><a class="bold" 
				href="javascript:getMultiSongGraph('${json[0].artist_id}');">View weekly performance for all songs by 
				${json[0].artist_name.replace(/^The /, 'the ')}</a></div>`) +
				'<div>Click titles to view chart performance graphs</div>';
			$('#subtitle').html(subtitle);
			const config = Object.assign({}, baseConfig);
			config.data = { datasets: Object.assign([], baseDatasets) };
			config.data.labels = json.map(song => song.peak_week.substring(0, 10));
			config.data.datasets[0].label = 'Chart Position';
			config.data.datasets[0].data = json.map(song => song.peak_position);

			config.options.onClick = event => {
				const points = currentGraph.getElementsAtEventForMode(event, 'nearest', {intersect: true}, true);
				if (points.length) getSongGraph(json[points[0].index].song_id);
			};
			config.options.plugins.datalabels.color = ctx => '#1880e7';
			config.options.plugins.datalabels.align = ctx => ctx.dataIndex === 0 ? 'right' :
				(json.length > 1 && ctx.dataIndex === json.length - 1) ? 'left' : 'bottom';
			config.options.plugins.datalabels.formatter = (value, ctx) => {
				let title = json[ctx.dataIndex].song_title;
				if (title.length >= 8) title = title.replace(/^(.{8}\w*)\s/, '$1\n');
				return `#${json[ctx.dataIndex].peak_position} ${title}`;
			};
			config.options.plugins.datalabels.listeners = {
				click: (ctx, event) => getSongGraph(json[ctx.dataIndex].song_id)
			}
			displayGraph(config);
		})
		.catch(err => handleError(err));
	} catch (err) {
		handleError(err);
	}
};

const getSongGraph = async songId => {
	try {
		if (!songId) return;
		clearTitles();
		currentScreen = 'song-graph';
		fetch(`/songs/${songId}/graph`)
		.then(res => {
			if (!res.ok) throw new Error(res.statusText);
			return res.json();
		})
		.then(data => {
			$('#title').html(`"${data[0].song_title}" by <a href="javascript:getArtistGraph('${data[0].artist_id}')">${data[0].artist_name}</a>`);
			$('#subtitle').html(`
				<div class="bold">All songs by ${data[0].artist_name.replace(/^The /, 'the ')}: 
				<a href="javascript:getArtistGraph('${data[0].artist_id}')">Peak position</a> | 
				<a href="javascript:getMultiSongGraph('${data[0].artist_id}')">Weekly performance</a></div>
				<div>Click graph points to view full charts for each week</div>
			`);
			fetch(`/artists/${data[0].artist_id}/songs`)
			.then(res => {
				if (!res.ok) throw new Error(res.statusText);
				return res.json();
			})
			.then(otherSongs => {
				if (otherSongs.length > 1) {
					const artistOtherSongs = document.createElement('select');
					$(artistOtherSongs).attr('id', 'artist-other-songs');
					$(artistOtherSongs).append(`<option value="">Other songs by ${data[0].artist_name}</option>`);
					otherSongs.forEach(song =>
						$(artistOtherSongs).append(`<option value="${song.song_id}">${song.song_title} (#${song.peak_position}, ${song.first_week.substring(0, 4)})</option>`));
					$(artistOtherSongs).on('change', () => getSongGraph($(artistOtherSongs).val()));
					$(artistOtherSongs).prependTo($('#subtitle'));
				}
			})
			.catch(err => {
				console.error(err);
			});

			const config = Object.assign({}, baseConfig);
			config.data = { datasets: Object.assign([], baseDatasets) };
			config.data.labels = data.map(song => song.date.substring(0, 10));
			config.data.datasets[0].label = 'Chart Position';
			config.data.datasets[0].data = data.map(song => song.position);
			config.options.onClick = event => {
				const points = currentGraph.getElementsAtEventForMode(event, 'nearest', {intersect: true}, true);
				if (points.length) getTop100(data[points[0].index].date.substring(0, 10));
			};
			config.options.plugins.datalabels.offset = 10;
			config.options.plugins.datalabels.align = 'bottom';
			config.options.plugins.datalabels.formatter = (value, ctx) => data[ctx.dataIndex].position;
			config.options.plugins.datalabels.listeners = {
				click: (ctx, event) => getTop100(data[ctx.dataIndex].date.substring(0, 10))
			};
			config.options.tooltip = {yAlign: 'bottom'};
			displayGraph(config);
		}).catch(err => handleError(err));
	} catch (err) {
		handleError(err);
	}
};

const getMultiSongGraph = async artistId => {
	try {
		if (!artistId) return;
		clearTitles();
		currentScreen = 'multi-song-graph';
		fetch(`/artists/${artistId}/songs/graph`)
		.then(res => {
			if (!res.ok) throw new Error(res.statusText);
			return res.json();
		})
		.then(data => {
			$('#title').html(`<div class="bold">All songs by ${data.charts[0][0].artist_name}</div> `);
			$('#subtitle').html(`
				<div class="bold"><a href="javascript:getArtistGraph('${data.charts[0][0].artist_id}')">View peak positions only</a></div>
				<div>Click titles to see details for specific songs or graph points to view full chart for corresponding week</div>
			`);
			const config = Object.assign({}, baseConfig);
			config.data = { datasets: Object.assign([], baseDatasets) };
			config.data.labels = data.dates.map(date => date.substring(0, 10));
			config.data.datasets = data.charts.map(song => {
				const data = {};
				song.forEach(song => data[song.date.substring(0, 10)] = song.position);
				return {
					label: song[0].song_title,
					data,
					clip: false,
					tension: 0.1,
					pointRadius: 5,
					pointHoverRadius: 10
				};
			});
			config.options.onClick = (ctx, event) => {
				const date = data.charts[event[0].datasetIndex][event[0].index].date.substring(0, 10);
				getTop100(date);
			};
			config.options.plugins.legend = {
				position: 'top',
				labels: {
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 12
					}
				},
				onClick: (event, legendItem, legend) => {
					const songId = data.charts[legendItem.datasetIndex][0].song_id;
					getSongGraph(songId);
				}
			};
			config.options.plugins.datalabels.align = 'bottom';
			config.options.plugins.datalabels.formatter = (value, ctx) => {};
			displayGraph(config);
		})
		.catch(err => handleError(err));
	} catch (err) {
		handleError(err)
	}
};

const getTop100 = async chartDate => {
	try {
		clearTitles();
		currentScreen = 'top-100';
		fetch(`/charts/${chartDate}`)
		.then(res => {
			if (!res.ok) throw new Error(res.statusText);
			return res.json();
		})
		.then(json => {
			const template = Handlebars.compile($('#top100-template').html());
			$('#title').html('<div>Top 100 Chart: <span id="other-chart-date"></span></div>');
			let clonedChartDates = $('#chart-date').clone(true);
			clonedChartDates.attr('id', 'other-chart-date-select');
			clonedChartDates.appendTo($('#other-chart-date'));
			$('#other-chart-date-select').val(json.id);
			$('#chartjs-canvas-container').hide();
			$('#content-container').html(template(json));
			$('#content-container').show();
		})
		.catch(err => handleError(err));
	} catch (err) {
		handleError(err);
	}
};

const baseDatasets = [{
	borderColor: '#bbccdd',
	clip: false,
	pointRadius: 7,
	pointBackgroundColor: '#1880e7',
	pointBorderColor: '#1469be',
	pointHoverRadius: 12,
	pointHoverBackgroundColor: '#ffcc00',
	pointHoverBorderColor: '#eabb00'
}];

const baseConfig = {
	type: 'line',
	options: {
		responsive: true,
		animation: {
			onComplete: () => {
			}
		},
		plugins: {
			legend: {
				position: 'top',
				labels: {
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 13,
						weight: 600
					}
				}
			},
			datalabels: {
				color: 'black',
				font: {
					size: 16,
					family: 'Rubik,sans-serif',
					weight: 600
				},
				rotation: 0,
				offset: 15
			}
		},
		scales: {
			x: {
				ticks: {
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 16,
						weight: 'bold'
					}
				}
			},
			y: {
				min: 1,
				max: 100,
				reverse: true,
				ticks: {
					stepSize: 5,
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 16,
						weight: 'bold'
					}
				}
			}
		}
	},
};

const fetchChartDates = chartId => {
	fetch('/charts/dates')
	.then(res => res.json())
	.then(json => {
		$('#chart-date').append(`<option value="">Select chart date</option>`);
		json.forEach(row => {
			$('#chart-date').append(`<option value="${row.id}">${row.date}</option>`);
		})
		if (chartId) $('#chart-date').val(chartId);
	})
	.catch(err => console.error(err));

	$('#chart-date').on('change', event => {
		$('#chart-date > option').each((index, option) => {
			if (option.value === event.target.value) getTop100(option.text);
		});
	});
};

const fetchArtists = artistId => {
	fetch('/artists')
	.then(res => res.json())
	.then(json => {
		$('#artists').append(`<option value="">Select artist</option>`);
		json.forEach(artist => {
			$('#artists').append(`<option value="${artist.id}">${artist.name.substring(0, 50)}</option>`);
		})
		if (artistId) $('#artists').val(artistId);
		$('#artists').on('change', event => getArtistGraph($('#artists').val()));
	})
	.catch(err => console.error(err));
};
