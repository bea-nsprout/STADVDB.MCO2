import { oltpdb } from "$lib/db/oltpdb";
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
    passengers,
    selectedSeats,
    timeStart,
    filterType,
    date,
    timeDepart,
    timeArrive,
    cost,
    email
  } = await request.json() as BookingData;
  for (const val in selectedSeats) {
	const res = await oltpdb.transaction().execute(async (trx) => { 
		trx.insertInto("bookings")
      .values({
        email,
        
      })
	})
  }

  return new Response(JSON.stringify({ message: 'Data received', body: {} }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}