<script lang="ts">
	import type { BookingData } from '$lib/stores/booking';
</script>

<h1>hii</h1>
<button
	onclick={async () => {
		const body: BookingData = {
			email: 'jerichoreyes@gmail.com',
			train: '2',
			classType: 'Economy',
			stationFrom: 'Tokyo',
			stationTo: 'Shin-Yokohama',
			selectedSeats: [
				{ car: 3, col: 1, row: 2 },
				{ car: 3, col: 5, row: 2 }
			],
			cost: 6969,
			cost_total: 6969,
			journey: '62',

			// the following doesn't matter anymore
			date: new Date().toISOString(),
			filterType: 'what',
			passengers: 1,
			timeArrive: 'ther',
			timeDepart: 'there',
			timeStart: 'there'
		};

		console.log(JSON.stringify(body));
		const res = await fetch('/api/bookings', {
			method: 'POST',
			body: JSON.stringify(body)
		});

		console.log(res, await res.json());
	}}>this is a buttn</button
>
