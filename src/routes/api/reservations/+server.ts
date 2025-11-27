import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { olapdb } from '$lib/db/olapdb';
import { sql } from 'kysely';

export const GET: RequestHandler = async () => {
	try {
		// Get reservations per class over time with daily granularity
		const reservationsByClass = await olapdb
			.selectFrom('reports.tickets as t')
			.innerJoin('reports.seats as s', 's.id', 't.seat')
			.innerJoin('reports.dates as d', 'd.id', 't.depart_date')
			.select([
				's.class as class',
				'd.year as year',
				'd.month as month',
				'd.day as day'
			])
			.select((eb) => eb.fn.count<number>('t.id').as('reservations'))
			.groupBy(['s.class', 'd.year', 'd.month', 'd.day'])
			.orderBy(['d.year', 'd.month', 'd.day'])
			.execute();

		// Group by class
		const classData = new Map<string, Array<{ date: Date; reservations: number }>>();

		reservationsByClass.forEach(row => {
			const className = row.class;
			if (!classData.has(className)) {
				classData.set(className, []);
			}
			// Create date from year/month/day
			const date = new Date(Number(row.year), Number(row.month) - 1, Number(row.day));
			classData.get(className)!.push({
				date,
				reservations: Number(row.reservations)
			});
		});

		// Format for frontend (ensure all 3 classes exist)
		const classes = ['First', 'Business', 'Economy'];
		const reservationsPerClass = classes.map(className => ({
			id: `${className} Class`,
			data: classData.get(className) || []
		}));

		// Calculate total reservations per date
		const allDates = new Map<string, number>();
		reservationsByClass.forEach(row => {
			const dateKey = `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`;
			allDates.set(dateKey, (allDates.get(dateKey) || 0) + Number(row.reservations));
		});

		const reservationsTotal = [{
			id: 'Total Reservations',
			data: Array.from(allDates.entries()).map(([dateStr, count]) => {
				const [year, month, day] = dateStr.split('-').map(Number);
				return {
					date: new Date(year, month - 1, day),
					reservations: count
				};
			}).sort((a, b) => a.date.getTime() - b.date.getTime())
		}];

		return json({
			reservationsPerClass,
			reservationsTotal
		});
	} catch (error) {
		console.error('Error fetching reservations:', error);
		return json(
			{ error: 'Failed to fetch reservations data' },
			{ status: 500 }
		);
	}
};
