import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions = {
	confirm: async ({ request }) => {
		const formData = await request.formData();

		// Extract booking data from form
		const booking = {
			email: formData.get('email')?.toString() || '',
			train: formData.get('train')?.toString() || '',
			classType: formData.get('classType')?.toString() || '',
			stationFrom: formData.get('stationFrom')?.toString() || '',
			stationTo: formData.get('stationTo')?.toString() || '',
			timeDepart: formData.get('timeDepart')?.toString() || '',
			timeArrive: formData.get('timeArrive')?.toString() || '',
			passengers: parseInt(formData.get('passengers')?.toString() || '0'),
			seats: JSON.parse(formData.get('seats')?.toString() || '[]'),
			cost: parseInt(formData.get('cost')?.toString() || '0')
		};

		// Validation
		if (!booking.email || !booking.email.includes('@')) {
			return fail(400, { error: 'Valid email is required', missing: 'email' });
		}

		if (booking.seats.length === 0) {
			return fail(400, { error: 'Please select at least one seat', missing: 'seats' });
		}

		// TODO: Here you would:
		// 1. Save to database
		// 2. Generate confirmation number
		// 3. Send confirmation email
		// 4. Check seat availability


		console.log('Booking confirmed:', booking);

		return {
			success: true,
			booking
		};
	}
} satisfies Actions;
