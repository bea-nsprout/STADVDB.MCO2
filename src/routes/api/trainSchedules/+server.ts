import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { oltpdb } from '$lib/db/oltpdb';

export const GET: RequestHandler = async ({ url }) => {
	const fromStn = url.searchParams.get('from');
	const endStn = url.searchParams.get('to');
	const timeStart = url.searchParams.get('timeStart');
	const timeEnd = url.searchParams.get('timeEnd');
	const timeType = url.searchParams.get('type')

	if(!fromStn || !endStn || !timeStart || !timeEnd || !timeType)
		return new Response("Missing fields", {
        status: 400
    })

	const direction = "east" // todo: change

	const tsStart = new Date(timeStart)
	const tsEnd = new Date(timeEnd)

	const query = oltpdb.selectFrom("trains")
		.innerJoin("journeys", "journeys.train_no", "trains.id")
		.innerJoin("routes", "journeys.route", "routes.id")
		.innerJoin("schedule", "schedule.journey_id", "journeys.id")
		.innerJoin("station", "station.id", "schedule.station")
		.where("schedule.station", "in", [fromStn, endStn])
		.where('journeys.id', 'in', (eb) =>
			eb.selectFrom("journeys as sub_jny")
				.innerJoin("routes as sub_rt", "sub_jny.route", "sub_rt.id")
				.innerJoin("schedule as sub_schd", "sub_schd.journey_id", "sub_jny.id")
				.select('sub_jny.id') 
				.where(({eb, and}) => and([
					eb("departure", ">=", tsStart),
					eb("departure", "<=", tsEnd),
					eb("schedule.station", "=", fromStn),
					eb("routes.direction", "=", direction)
				])
			)
		)
		.select(["schedule.departure", "schedule.arrival", "train_no", "capacity"])

	const res = await query.execute()
	console.log(res)
	
	return json(res);
};
