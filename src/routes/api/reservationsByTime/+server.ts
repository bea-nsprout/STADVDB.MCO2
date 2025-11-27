import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { olapdb } from '$lib/db/olapdb';

export const GET: RequestHandler = async () => {
	try {
		// Get reservations grouped by hour and day of week
		const query =  olapdb
			.selectFrom('reports.tickets as t')
			.innerJoin('reports.dates as d', 'd.id', 't.depart_date')
			.select([
				'd.hour as hour',
				'd.day_of_week as day_of_week'
			])
			.select((eb) => eb.fn.count<number>('t.id').as('count'))
			.groupBy(['d.hour', 'd.day_of_week'])
			.orderBy( 'd.day_of_week', 'asc')
			.orderBy( 'd.hour', 'asc')
			// .execute();
			console.log(query.compile().sql);
		console.log(query.compile().parameters);
		const reservationsByTime = await query.execute();

		// Initialize 2D array: 7 days × 24 hours (all zeros)
		const heatmapData: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

		// Fill in the actual data
		reservationsByTime.forEach(row => {
			const hour = Number(row.hour);
			const dayOfWeek = Number(row.day_of_week); // 0 = Sunday, 6 = Saturday
			const count = Number(row.count);

			if (hour >= 0 && hour < 24 && dayOfWeek >= 0 && dayOfWeek < 7) {
				heatmapData[dayOfWeek][hour] = count;
			}
		});

		return json({ heatmapData });
	} catch (error) {
		console.error('Error fetching reservations by time:', error);
		return json(
			{ error: 'Failed to fetch reservations by time data' },
			{ status: 500 }
		);
	}
};
