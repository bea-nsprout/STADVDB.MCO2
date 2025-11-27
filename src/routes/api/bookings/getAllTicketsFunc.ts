import { oltpdb } from "$lib/db/oltpdb";


export async function getAllBookings(): Promise<String[]>{
  try{
    const users = await oltpdb.selectFrom("bookings").distinct().select("email").execute();
    console.log(users);
    return users.map((row) => (row.email));
  }

  catch(error){
    console.log(error);
    return []  
  }
}