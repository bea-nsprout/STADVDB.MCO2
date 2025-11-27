import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { oltpdb } from '$lib/db/oltpdb';
import { getStationIndex } from '$lib/data/stations';

export const GET: RequestHandler = async ({ url }) => {
	const fromStn = url.searchParams.get('from');
	const endStn = url.searchParams.get('to');
	const timeStart = url.searchParams.get('timeStart');
	const timeEnd = url.searchParams.get('timeEnd');
	const timeType = url.searchParams.get('type');
	const cls = url.searchParams.get('cls');

	if (!fromStn || !endStn || !timeStart || !timeEnd || !timeType)
		return new Response('Missing fields', {
			status: 400
		});
	const from = getStationIndex(fromStn);
	const to = getStationIndex(endStn);

	const direction = from - to > 0 ? 'Eastbound' : 'Westbound';

	console.log(from, to, fromStn, endStn, direction);
	const tsStart = new Date(timeStart);
	const tsEnd = new Date(timeEnd);
	console.log(tsStart, tsEnd);

	const query = oltpdb
		.selectFrom('trains')
		.innerJoin('journeys', 'journeys.train_no', 'trains.id')
		.innerJoin('routes', 'journeys.route', 'routes.id')
		.innerJoin('schedule as dept_sched', 'dept_sched.journey_id', 'journeys.id')
		.innerJoin('schedule as arriv_sched', 'arriv_sched.journey_id', 'journeys.id')
		.leftJoin('tickets', 'tickets.journey', 'journeys.id')
		.leftJoin('seat', 'seat.id', 'tickets.seat')
		.leftJoin('cars', 'cars.id', 'seat.car')
		.where('dept_sched.station', '=', fromStn)
		.where('arriv_sched.station', '=', endStn)
		.where('tickets.class', '=', cls)
		.where('dept_sched.departure', '>=', tsStart)
		.where('dept_sched.departure', '<=', tsEnd)
		.where('routes.direction', '=', direction)
		.groupBy([
			'journeys.id',
			'tickets.class',
			'journeys.train_no',
			/* "cars.car_no", 
			"cars.seat_count",*/
			'dept_sched.departure',
			'arriv_sched.arrival'
		])
		.select([
			'journeys.id as name',
			'dept_sched.departure as departs',
			'arriv_sched.arrival as arrives',
			'journeys.train_no as journey_id',
			// 	(eb) => eb("cars.seat_count", "-", oltpdb.fn.count<number>("tickets.class")).as("occupied")
		]);

	const res = await query.execute();
	console.log(res);

	return json(res);
};
