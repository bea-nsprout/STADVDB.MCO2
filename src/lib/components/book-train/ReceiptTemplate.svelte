<script lang="ts">
	import type { BookingData } from '$lib/stores/booking.ts';

	export let booking: BookingData;
</script>

<section class="white w-[40rem] items-center mx-auto">
	<div class="flex flex-row justify-between items-center">
		<span class="text-[var(--color-accent)] text-[2rem]">{booking.stationFrom}</span>
		<span>to</span>
		<span class="text-[var(--color-accent)] text-[2rem]">{booking.stationTo}</span>
	</div>

	<hr>

	<div class="grid grid-cols-3 gap-2">
		<div>Train: {booking.train}</div>
		<div>Class: {booking.classType}</div>
		<div>Seat: {booking.selectedSeats.map(s => `${s.car}-${s.seat}`).join(', ')}</div>
		<div>Date: {booking.date}</div>
		<div>Departs: {booking.timeDepart}</div>
		<div>Arrives: {booking.timeArrive}</div>
	</div>
</section>