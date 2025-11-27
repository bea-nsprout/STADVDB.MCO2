import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { oltpdb } from '$lib/db/oltpdb';
import { getDirection, getStationIndex } from '$lib/data/stations';

export const GET: RequestHandler = async ({ url }) => {
	const fromStn = url.searchParams.get('from');
	const endStn = url.searchParams.get('to');
	const journey_id = url.searchParams.get('journey');
	const cls = url.searchParams.get('cls');

	if (!fromStn || !endStn || !journey_id || !cls)
		return new Response('Missing fields', {
			status: 400
		});
	const from = getStationIndex(fromStn);
	const to = getStationIndex(endStn);
	const direction = getDirection(from, to)

	console.log(from, to, journey_id, cls);

	const query = oltpdb
		.selectFrom('journeys')
		.leftJoin('tickets', 'tickets.journey', 'journeys.id')
		.leftJoin('seat', 'seat.id', 'tickets.seat')
		.leftJoin('cars', 'cars.id', 'seat.car')
        .where('tickets.journey', "=", journey_id)
        .where('tickets.class', '=', cls)
		.$if((direction === "Eastbound"), (qb) => qb.where(eb => eb.and([
			eb('tickets.origin', '>', to.toString()), 
			eb('tickets.destination', '<', from.toString())
		])))
		.$if((direction === "Westbound"), (qb) => qb.where(eb => eb.and([
			eb('tickets.origin', '<', to.toString()), 
			eb('tickets.destination', '>', from.toString())
		])))
		.orderBy("cars.id", "asc")
		.orderBy("seat.column", "asc")
		.orderBy("seat.row", "asc")
		.select([
			"seat.car",
			"seat.column",
            "seat.row"
        ]);

	console.log(query.compile().query)
	const res = await query.execute();
	console.log(res);

	return json(res);
};
