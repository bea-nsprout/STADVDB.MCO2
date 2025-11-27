import { getStationIndex } from "$lib/data/stations.js";
import { oltpdb } from "$lib/db/oltpdb";
import type { BookingData } from "$lib/stores/booking";
import { json, type RequestHandler } from "@sveltejs/kit"
import { DatabaseError } from "pg";

export const GET: RequestHandler = async ({url}) => {

    const email = url.searchParams.get("email");
    const page = Number(url.searchParams.get("page"));
    const pageContentCount = 50

    
    if(!email) return new Response("Missing email parameter. https://http.cat/status/400", {
        status: 400
    })
    
    try {
        console.log("hi");
        const stuff = await oltpdb.selectFrom("bookings")
                                    .where("email", "=", email)
                                    .selectAll()
                                    .offset(page * pageContentCount)
                                    .limit(pageContentCount)
                                    .execute();
        return json(stuff)
    } catch (error) {
        if(error instanceof DatabaseError) {
        return json(error, {status: 500}); // ;alsdkfj
        }

        return json(error, {status: 500});

    }


    



}

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
  } = await request.json() as BookingData;

  const origin = getStationIndex(stationFrom).toString()
  const destination = getStationIndex(stationTo).toString()
  
  const trx = await oltpdb.startTransaction().execute()
  try { 
    const booking_id = (
      await trx.insertInto("bookings")
      .values({
        email,
        cost_total
      })
      .returning('bookings.id')
      .executeTakeFirst()
    )!.id

    selectedSeats.forEach (async (val) => {
      const seat = parseInt((await trx.selectFrom("seat")
        .innerJoin("cars", "cars.id", "seat.car")
        .where("cars.train_id", "=", train)
        .where("cars.car_no", "=", val.car)
        .where("seat.row", "=", val.row)
        .where("seat.column", "=", val.col)
        .select("seat.id")
        .executeTakeFirstOrThrow()).id)

      const check = await trx.selectFrom('journeys')
        .leftJoin('tickets', 'tickets.journey', 'journeys.id')
        .where('tickets.journey', "=", journey)
        .where('tickets.seat', '=', seat)
        .where('tickets.origin', '>=', origin)
        .where('tickets.destination', '<=', destination)
        .select("tickets.ticket_id")
        .executeTakeFirst()
      
      if(check != undefined)
        throw new Error(`Seat already taken! Car ${val.car} Row ${val.row} + Col ${val.col}`)
      else await trx.insertInto("tickets")
        .values({
          booking_id,
          cost,
          seat,
          class: classType,
          origin,
          destination, 
          journey
        })
        .executeTakeFirst()
    })
  } 
  catch (error) {
    console.log(error)
    await trx.rollback().execute()
  }

  return new Response(JSON.stringify({ message: 'Data received', body: {} }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}