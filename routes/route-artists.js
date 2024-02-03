const database = require('../data/database');
const util = require('../util');
const moment = require('moment/moment');

module.exports = app => {
	app.get('/artists', async (req, res, next) => {
		const data = await database.select(`select * from artist order by name`);
		res.json(data[0]);
	});

	app.get('/artists/:id/songs/graph', async (req, res, next) => {
		const artistId = req.params.id;
		if (!artistId || !util.isValidUuid(artistId)) return res.sendStatus(400);
		const data = await database.select(`select * from chart_view where artist_id = '${artistId}' order by song_id, date`);
		if (data[0].length === 0) return res.sendStatus(404);
		const songs = {};
		let minDate, maxDate;
		data[0].forEach(chartWeek => {
			if (!minDate || chartWeek.date < minDate) minDate = chartWeek.date;
			if (!maxDate || chartWeek.date > maxDate) maxDate = chartWeek.date;
			if (!songs[chartWeek.song_id]) songs[chartWeek.song_id] = [];
			songs[chartWeek.song_id].push(chartWeek);
		});

		const min = moment(minDate);
		const max = moment(maxDate);
		const dates = [ min.toDate() ];

		do {
			min.add(1, 'week');
			if (min <= max) dates.push(min.toDate());
		} while (min <= max);

		res.json({ dates, charts: Object.values(songs)} );
	});

	app.get('/artists/:id/songs', async (req, res, next) => {
		const artistId = req.params.id;
		if (!artistId || !util.isValidUuid(artistId)) return res.sendStatus(400);
		const data = await database.select(
			`select * from artist_song_view where artist_id = '${req.params.id}' order by first_week`);
		if (data[0].length === 0) return res.sendStatus(404);
		res.json(data[0]);
	});
};
