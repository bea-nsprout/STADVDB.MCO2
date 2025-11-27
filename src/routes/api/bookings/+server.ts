import { getDirection, getStationIndex } from '$lib/data/stations.js';
import { oltpdb } from '$lib/db/oltpdb';
import type { BookingData } from '$lib/stores/booking';
import { json, type RequestHandler } from '@sveltejs/kit';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { DatabaseError } from 'pg';

// export async function getAllBookings(): Promise<{ email: string; id: string }[]> {
// 	try {
// 		const users = await oltpdb.selectFrom('bookings').selectAll().execute();
// 		return users.map((row) => ({
// 			email: row.email,
// 			id: row.id
// 		}));
// 	} catch (error) {
// 		console.log(error);
// 		return [];
// 	}
// }

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email');
	const page = Number(url.searchParams.get('page'));
	const pageContentCount = 5;

	if (!email)
		return new Response('Missing email parameter. https://http.cat/status/400', {
			status: 400
		});

	try {
		const query = oltpdb
			.with('filtered_bookings', (db) =>
				db
					.selectFrom('bookings')
					.where('email', '=', email)
					.selectAll()
					.offset(page * pageContentCount)
					.limit(pageContentCount)
			)
			.with('ungrouped_tickets', (db) =>
				db
					.selectFrom('filtered_bookings')
					.innerJoin('tickets', 'filtered_bookings.id', 'booking_id')
					.innerJoin('journeys', 'journeys.id', 'tickets.journey')
					.innerJoin('station as os', 'os.id', 'tickets.origin')
					.innerJoin('station as ds', 'ds.id', 'tickets.destination')
					.innerJoin('schedule as depart_sched', 'depart_sched.station', 'os.name')
					.innerJoin('schedule as arrive_sched', 'arrive_sched.station', 'ds.name')
					.whereRef('tickets.journey', '=', 'depart_sched.journey_id')
					.whereRef('tickets.journey', '=', 'arrive_sched.journey_id')
					.select([
						'filtered_bookings.id as booking_id',
						(eb) =>
							jsonBuildObject({
								id: eb.ref('ticket_id'),
								origin: eb.ref('os.name'),
								destination: eb.ref('ds.name'),
								departure: eb.ref('depart_sched.departure'),
								arrival: eb.ref('arrive_sched.arrival'),
								seat: eb.ref('tickets.seat'),
								class: eb.ref('class'),
								journey_id: eb.ref('journeys.id')
							}).as('ticket')
					])
			)
			.selectFrom('ungrouped_tickets')
			.select(['booking_id', (eb) => eb.fn.jsonAgg('ticket').as('tickets')])
			.groupBy('booking_id');

		const values = await query.execute();

		return json(values);
	} catch (error) {
		if (error instanceof DatabaseError) {
			return json(error, { status: 500 }); // ;alsdkfj
		}

		return json(error, { status: 500 });
	}
};

export async function POST({ request }) {
	const {
		train,
		classType,
		stationFrom,
		stationTo,
		selectedSeats,
		journey,
		cost,
		email,
		cost_total
	} = (await request.json()) as BookingData;

	console.log();

	const origin = getStationIndex(stationFrom);
	const destination = getStationIndex(stationTo);
	const direction = getDirection(origin, destination);

	console.log(
		train,
		classType,
		stationFrom,
		stationTo,
		selectedSeats,
		journey,
		cost,
		email,
		cost_total
	);

	// return json({ message: 'YIPEE' });

	const trx = await oltpdb.startTransaction().setIsolationLevel('serializable').execute();
	try {
		const booking_id = (await trx
			.insertInto('bookings')
			.values({
				email,
				cost_total
			})
			.returning('bookings.id')
			.executeTakeFirst())!.id;

		const promises = await Promise.allSettled(
			selectedSeats.map(async (val) => {
				console.log(
					trx
						.selectFrom('seat')
						.innerJoin('cars', 'cars.id', 'seat.car')
						.where('cars.train_id', '=', train)
						.where('cars.car_no', '=', val.car)
						.where('seat.row', '=', val.row)
						.where('seat.column', '=', val.col)
						.select('seat.id')
						.compile().sql
				);
				const seat = parseInt(
					(
						await trx
							.selectFrom('seat')
							.innerJoin('cars', 'cars.id', 'seat.car')
							.where('cars.train_id', '=', train)
							.where('cars.car_no', '=', val.car)
							.where('seat.row', '=', val.row)
							.where('seat.column', '=', val.col)
							.select('seat.id')
							.executeTakeFirstOrThrow()
					).id
				);
				console.log('HII');

				const check = await trx
					.selectFrom('journeys')
					.leftJoin('tickets', 'tickets.journey', 'journeys.id')
					.where('tickets.journey', '=', journey)
					.where('tickets.seat', '=', seat)
					.where('tickets.origin', '>=', origin.toString())
					.where('tickets.destination', '<=', destination.toString())
					.$if(direction === 'Eastbound', (qb) =>
						qb.where((eb) =>
							eb.and([
								eb('tickets.origin', '>', destination.toString()),
								eb('tickets.destination', '<', origin.toString())
							])
						)
					)
					.$if(direction === 'Westbound', (qb) =>
						qb.where((eb) =>
							eb.and([
								eb('tickets.origin', '<', destination.toString()),
								eb('tickets.destination', '>', origin.toString())
							])
						)
					)
					.select('tickets.ticket_id')
					.executeTakeFirst();

				if (check != undefined)
					throw new Error(`Seat already taken! Car ${val.car} Row ${val.row} + Col ${val.col}`);
				else
					await trx
						.insertInto('tickets')
						.values({
							booking_id,
							cost,
							seat,
							class: classType,
							origin,
							destination,
							journey
						})
						.executeTakeFirst();
			})
		);

		console.log(promises);

		if (promises.filter((promise) => promise.status === 'rejected').length == 0)
			await trx.commit().execute();
		else throw new Error(`Something went wrong`);
	} catch (error) {
		console.log(error);
		await trx.rollback().execute();
		return new Response(
			JSON.stringify({ message: 'Booking failed! https://http.cat/status/400' }),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 400
			}
		);
	}

	return new Response(JSON.stringify({ message: 'Booking confirmed!' }), {
		headers: { 'Content-Type': 'application/json' },
		status: 200
	});
}

interface DeleteBody {
	bookingID: string;
}

export async function DELETE({ request }) {
	const { bookingID }: DeleteBody = await request.json();

	if (!bookingID)
		return json(
			{ message: 'needs bookingID.', httpcat: 'https://http.cat/status/400' },
			{
				status: 400
			}
		);

	try {
		const res = await oltpdb
			.deleteFrom('bookings')
			.where('bookings.id', '=', bookingID)
			.executeTakeFirstOrThrow();

		if (res.numDeletedRows <= 0)
			return json(
				{ message: 'Possibly already deleted.' },
				{
					status: 404
				}
			);

		return json({
			message: 'Deleted. fuck yeah'
		});
	} catch (error) {
		return json(
			{ message: 'Something went wrong.', error },
			{
				status: 500
			}
		);
	}
}
