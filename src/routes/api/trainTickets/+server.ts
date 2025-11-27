import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { oltpdb } from '$lib/db/oltpdb';
import { getStationIndex } from '$lib/data/stations';

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

	console.log(from, to, journey_id, cls);

	const query = oltpdb
		.selectFrom('journeys')
		.leftJoin('tickets', 'tickets.journey', 'journeys.id')
		.leftJoin('seat', 'seat.id', 'tickets.seat')
		.leftJoin('cars', 'cars.id', 'seat.car')
        .where('tickets.class', '=', cls)
		.where('tickets.origin', '<', fromStn)
        .where('tickets.destination', '>', endStn)
		.select([
			"cars.car_no",
            "cars.seat_count",
			"seat.column",
            "seat.row"
        ]);

	const res = await query.execute();
	console.log(res);

	return json(res);
};
