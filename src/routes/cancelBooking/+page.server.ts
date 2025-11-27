import type { PageServerLoad } from './$types';
import { getAllBookings } from '../api/bookings/+server';

export const load: PageServerLoad<{names: {email: string, id: string}[]}> = async () => {
    const names: {email: string, id: string}[] =await getAllBookings();
    return { names };
}