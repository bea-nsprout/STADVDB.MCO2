import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { oltpdb } from '$lib/db/oltpdb';
import { getStationIndex } from '$lib/data/stations';

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
	const from = getStationIndex(fromStn)
	const to = getStationIndex(endStn)
	const cls = "First"

	const direction = from - to > 0 ? "Eastbound" : "Westbound"

	console.log(from, to, fromStn, endStn, direction)
	const tsStart = new Date(timeStart)
	const tsEnd = new Date(timeEnd)
	console.log(tsStart, tsEnd)

	const query = oltpdb.selectFrom("trains")
		.innerJoin("journeys", "journeys.train_no", "trains.id")
		.innerJoin("routes", "journeys.route", "routes.id")
		.innerJoin("schedule", "schedule.journey_id", "journeys.id")
		.innerJoin("tickets", "tickets.journey", "journeys.id")
		.innerJoin("seat", "seat.id", "tickets.seat")
		.innerJoin("cars", "cars.id", "seat.car")
		.where("schedule.station", "in", [fromStn, endStn])
		.where("tickets.class", "=", cls)
		.where('journeys.id', 'in', (eb) =>
			eb.selectFrom("journeys as sub_jny")
				.innerJoin("routes as sub_rt", "sub_jny.route", "sub_rt.id")
				.innerJoin("schedule as sub_schd", "sub_schd.journey_id", "sub_jny.id")
				.select('sub_jny.id')
				.where("sub_schd.departure", ">=", tsStart)
				.where("sub_schd.departure", "<=", tsEnd)
				.where("sub_schd.station", "=", fromStn)
				.where("routes.direction", "=", direction)
			)
		.groupBy(["journeys.id", "cars.car_no", "tickets.class", "schedule.departure", 
			"schedule.arrival", 
			"journeys.train_no", 
			"trains.capacity", 
			"cars.seat_count",
			"schedule.station"
		])
		.select(["schedule.departure", 
			"schedule.arrival", 
			"journeys.train_no", 
			"trains.capacity", 
			"cars.seat_count",
			"schedule.station",
			(eb) => eb.fn.count<number>("cars.car_no").as("car_amount"),
			(eb) => eb.fn.count<number>("tickets.class").as("occupancy")
		])

	const res = await query.execute()
	console.log(res)
	
	return json(res);
};