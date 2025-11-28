import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions = {
	confirm: async ({ request }) => {
		const formData = await request.formData();
		const seatArray = JSON.parse(formData.get('seats')?.toString()).map(({seat,...rest}) => rest);
		// Extract booking data from form
		const booking = {
			email: formData.get('email')?.toString() || '',
			train: parseInt(formData.get('train')) || 0,
			classType: formData.get('classType')?.toString() || '',
			stationFrom: formData.get('stationFrom')?.toString() || '',
			stationTo: formData.get('stationTo')?.toString() || '',
			selectedSeats: seatArray || [],
			cost: parseInt(formData.get('cost')?.toString() || '0'),
			cost_total: parseInt(formData.get('cost_total')?.toString() || '0'),
			journey: parseInt(formData.get('journey')) || 0
		};

		console.log('Booking Data:', booking);
		// Validation
		if (!booking.email || !booking.email.includes('@')) {
			return fail(400, { error: 'Valid email is required', missing: 'email' });
		}

		if (booking.selectedSeats.length === 0) {
			return fail(400, { error: 'Please select at least one seat', missing: 'seats' });
		}

		// TODO: Here you would:
		// 1. Save to database

		console.log("SAVING TO DB NOW!!!")
		try{
			const res = await fetch('/api/bookings', {
			method: 'POST',
			headers: {
      			'Content-Type': 'application/json'
    		},
			body: JSON.stringify(booking)
		})	

		if(res.ok){
			console.log('Booking confirmed:', booking);

			return {
			success: true,
			booking
			};
		}
		
		
		} catch(error){
			return fail(500, {error: "Failed to confirm booking"})
		}
	}
} satisfies Actions;
