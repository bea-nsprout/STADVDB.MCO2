import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Train } from '$lib/types/train';

// TODO: Replace with Supabase query
const trainSchedules: Train[] = [
	{
		id: "1000",
		name: "Thomas the Train",
		departs: "2:31 AM",
		arrives: "3:59 AM",
		capacity: [16, 64, 80]
	},
	{
		id: "1001",
		name: "Thomas the Train",
		departs: "3:32 AM",
		arrives: "4:53 AM",
		capacity: [16, 64, 80]
	},
	{
		id: "1002",
		name: "Thomas the Train",
		departs: "3:32 AM",
		arrives: "4:53 AM",
		capacity: [16, 64, 80]
	}
];

export const GET: RequestHandler = async ({ url }) => {
	const scheduleId = url.searchParams.get('id');
	const date = url.searchParams.get('date');
	const timeStart = url.searchParams.get('timeStart');
	const timeEnd = url.searchParams.get('timeEnd');

	// TODO: Replace entire mock logic below with Supabase query:
	//
	// let query = supabase.from('train_schedules').select('*');
	//
	// if (scheduleId) {
	//   query = query.eq('id', scheduleId);
	// }
	// if (date) {
	//   query = query.eq('date', date);
	// }
	// if (timeStart) {
	//   query = query.gte('departs', timeStart);
	// }
	// if (timeEnd) {
	//   query = query.lte('departs', timeEnd);
	// }
	//
	// const { data, error } = await query;
	// if (error) return json({ error: error.message }, { status: 500 });
	// return json(data);



	return json(trainSchedules);
};
