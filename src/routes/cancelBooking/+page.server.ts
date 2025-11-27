import type { PageServerLoad } from './$types';
import { getAllBookings } from '../api/bookings/+server';

export const load: PageServerLoad<{names: String[]}> = async () => {
    const names: String[] =await getAllBookings();
    return { names };
}