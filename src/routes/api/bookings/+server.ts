import { oltpdb } from "$lib/db/oltpdb";
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