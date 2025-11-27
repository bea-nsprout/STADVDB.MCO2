import { getStationIndex } from "$lib/data/stations.js";
import { oltpdb } from "$lib/db/oltpdb";
import type { BookingData } from "$lib/stores/booking";
import { json, type RequestHandler } from "@sveltejs/kit"
import { DatabaseError } from "pg";

export const GET: RequestHandler = async ({url}) => {

    const email = url.searchParams.get("email");
    const page = Number(url.searchParams.get("page"));
    const pageContentCount = 5

    
    if(!email) return new Response("Missing email parameter. https://http.cat/status/400", {
        status: 400
    })
    
    try {
        console.log("hi");
        const query =  oltpdb.with("filtered_bookings", (db) => db.selectFrom("bookings")
                                    .where("email", "=", email)
                                    .selectAll()
                                    .offset(page * pageContentCount)
                                    .limit(pageContentCount))
                       
                        .selectFrom("filtered_bookings")
                        .innerJoin("tickets", "filtered_bookings.id", "booking_id")
                        .innerJoin("journeys", "journeys.id", "tickets.journey")
                        .innerJoin("station as os", "os.id", "tickets.origin")
                        .innerJoin("station as ds", "ds.id", "tickets.destination")
                        .innerJoin("schedule as depart_sched", "depart_sched.station","os.name")
                        .innerJoin("schedule as arrive_sched", "arrive_sched.station","ds.name")
                        .whereRef("tickets.journey", "=", "depart_sched.journey_id")
                        .whereRef("tickets.journey", "=", "arrive_sched.journey_id")
                        .select(["os.name as origin_station",
                            "ds.name as destination_station",
                        "depart_sched.departure", "arrive_sched.arrival",
                    "tickets.seat", "class", "booking_id"])
                    console.log(query.compile().sql)
        return json(await query.execute())
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

  const origin = getStationIndex(stationFrom)
  const destination = getStationIndex(stationTo)
  const direction = origin - destination > 0 ? 'Westbound' : 'Eastbound';
  
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

    const promises = await Promise.allSettled(selectedSeats.map(async (val) => {
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
          .where('tickets.origin', '>=', origin.toString())
          .where('tickets.destination', '<=', destination.toString())
          .$if((direction === "Eastbound"), (qb) => qb.where(eb => 
              eb.and([
              eb('tickets.origin', '>=', origin.toString()), 
              eb('tickets.destination', '<=', destination.toString())
            ])
          ))
          .$if((direction === "Westbound"), (qb) => qb.where(eb => 
            eb.and([
              eb('tickets.origin', '<=', origin.toString()), 
              eb('tickets.destination', '>=', destination.toString())
            ])
          ))
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
      }))
    
    if(promises.filter((promise) => promise.status === 'rejected').length == 0)
      await trx.commit().execute()
    else
      throw new Error(`Something went wrong`)
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