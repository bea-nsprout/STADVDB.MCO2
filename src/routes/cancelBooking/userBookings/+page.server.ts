import { GET } from '../../api/bookings/+server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // Get email from query parameter
  const email = event.url.searchParams.get('email');
  const res = await GET({url: event.url});

  const bookings = await res.json()

  console.log(bookings[0].tickets);
  return {
    bookings,
    email
  };
};