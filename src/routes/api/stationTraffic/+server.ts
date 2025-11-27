import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { olapdb } from '$lib/db/olapdb';
import { sql } from 'kysely';

export const GET: RequestHandler = async () => {
	try {
		// Get departures count per station from OLAP database
		const departuresQuery = await olapdb
			.selectFrom('reports.popular_routes')
			.select(['origin'])
			.select((eb) => eb.fn.sum<number>('trip_count').as('count'))
			.groupBy('origin')
			.execute();

		// Get arrivals count per station from OLAP database
		const arrivalsQuery = await olapdb
			.selectFrom('reports.popular_routes')
			.select(['destination'])
			.select((eb) => eb.fn.sum<number>('trip_count').as('count'))
			.groupBy('destination')
			.execute();

		// Station names in order (1-indexed in DB)
		const stationNames = ['Tokyo', 'Shin-Yokohama', 'Toyohashi', 'Nagoya', 'Kyoto', 'Shin-Osaka'];

		// Convert to arrays of 6 stations (fill missing with 0)
		const stationDepartures = Array(6).fill(0);
		const stationArrivals = Array(6).fill(0);

		departuresQuery.forEach(row => {
			const index = stationNames.indexOf(row.origin);
			if (index !== -1) {
				stationDepartures[index] = Number(row.count);
			}
		});

		arrivalsQuery.forEach(row => {
			const index = stationNames.indexOf(row.destination);
			if (index !== -1) {
				stationArrivals[index] = Number(row.count);
			}
		});

		return json({
			stationDepartures,
			stationArrivals
		});
	} catch (error) {
		console.error('Error fetching station traffic:', error);
		return json(
			{ error: 'Failed to fetch station traffic data' },
			{ status: 500 }
		);
	}
};
