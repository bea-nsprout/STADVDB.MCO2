import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { olapdb } from '$lib/db/olapdb';
import { sql } from 'kysely';

export const GET: RequestHandler = async () => {
	try {
		// Get revenue per class over time with daily granularity
		const revenueByClass = await olapdb
			.selectFrom('reports.tickets as t')
			.innerJoin('reports.seats as s', 's.id', 't.seat')
			.innerJoin('reports.dates as d', 'd.id', 't.depart_date')
			.select([
				's.class as class',
				'd.year as year',
				'd.month as month',
				'd.day as day'
			])
			.select((eb) => eb.fn.sum<number>('t.cost').as('revenue'))
			.groupBy(['s.class', 'd.year', 'd.month', 'd.day'])
			.orderBy(['d.year', 'd.month', 'd.day'])
			.execute();

		// Group by class
		const classData = new Map<string, Array<{ date: Date; revenue: number }>>();

		revenueByClass.forEach(row => {
			const className = row.class;
			if (!classData.has(className)) {
				classData.set(className, []);
			}
			// Create date from year/month/day
			const date = new Date(Number(row.year), Number(row.month) - 1, Number(row.day));
			classData.get(className)!.push({
				date,
				revenue: Number(row.revenue) / 1000 // Keep decimal for accuracy
			});
		});

		// Format for frontend (ensure all 3 classes exist)
		const classes = ['First', 'Business', 'Economy'];
		const revenuePerClass = classes.map(className => ({
			id: `${className} Class`,
			data: classData.get(className) || []
		}));

		// Calculate total revenue per date by summing the already-converted values
		const allDates = new Map<string, number>();
		revenueByClass.forEach(row => {
			const dateKey = `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`;
			const revenueInThousands = Number(row.revenue) / 1000;
			allDates.set(dateKey, (allDates.get(dateKey) || 0) + revenueInThousands);
		});

		const revenueTotal = [{
			id: 'Total Revenue',
			data: Array.from(allDates.entries()).map(([dateStr, amount]) => {
				const [year, month, day] = dateStr.split('-').map(Number);
				return {
					date: new Date(year, month - 1, day),
					revenue: amount // Already in thousands, keep decimal
				};
			}).sort((a, b) => a.date.getTime() - b.date.getTime())
		}];

		return json({
			revenuePerClass,
			revenueTotal
		});
	} catch (error) {
		console.error('Error fetching revenue:', error);
		return json(
			{ error: 'Failed to fetch revenue data' },
			{ status: 500 }
		);
	}
};
