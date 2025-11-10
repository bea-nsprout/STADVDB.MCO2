<script lang="ts">
	import { page } from '$app/state';
	import SearchFilter from '$lib/components/SearchFilter.svelte';

	const train = $derived(page.url.searchParams.get('train'));
	const classType = $derived(page.url.searchParams.get('class'));
	const seats = $derived(page.url.searchParams.get('seats'));
	let stationFrom = $derived(page.url.searchParams.get('from'));
	let stationTo = $derived(page.url.searchParams.get('to'));
	const carsTotal = 3;
	let carCurrent = $state(1);

	// disabling car next/previous buttons
	const arrowsDisabled = $derived([carCurrent === 1, carCurrent === carsTotal]);

	// Selected seats: array of {car: number, seat: string}
	let selectedSeats = $state([]);

	// Unavailable seats (already booked)
	let unavailableSeats = $state([
		{ car: 1, seat: "A2" },
		{ car: 1, seat: "B5" },
		{ car: 2, seat: "A3" },
		{ car: 3, seat: "B1" }
	]);

	function toggleSeat(seatId) {
		const seatObj = { car: carCurrent, seat: seatId };
		const existingIndex = selectedSeats.findIndex(
			s => s.car === carCurrent && s.seat === seatId
		);

		if (existingIndex >= 0) {
			selectedSeats.splice(existingIndex, 1);
		} else {
			selectedSeats.push(seatObj);
		}
	}

	function isSeatSelected(seatId) {
		return selectedSeats.some(s => s.car === carCurrent && s.seat === seatId);
	}

	function isSeatUnavailable(seatId) {
		return unavailableSeats.some(s => s.car === carCurrent && s.seat === seatId);
	}

	let classColor = "black";
	if (classType === "First") {
		classColor = "var(--color-accent)";
	} else if (classType === "Business") {
		classColor = "#929292";
	}
</script>


<!-- previous and next buttons -->
<section class="p-[2rem] flex flex-row justify-between">
	<button class="navigation flex-1 bg-black h-[4.5rem] w-[3.5rem] rounded-md" aria-label="previous car"
					disabled={arrowsDisabled[0]}
					onclick={() => {carCurrent--; console.log(carCurrent)}}>
		<i class="bi bi-chevron-left text-[3rem]" style="color: var(--color-primary)"></i></button>

	<section class="car-info w-full flex flex-col gap-[0.5rem] justify-center">
		<div class="flex flex-row justify-center">
			<span class="label"><b>Station</b></span>
			<div class="flex flex-wrap gap-auto">
				<input id="From" value={stationFrom} disabled/>
				<span class="flex-1 min-w-0"><i class="bi bi-arrow-right"></i></span>
				<input id="To" value={stationTo} disabled/>
			</div>
		</div>
		<div class="flex flex-row justify-center items-center gap-4 w-full">
			<h2 class="text-xl font-bold">Car #{carCurrent}</h2>
			<div class="text-white   flex-1 max-w-[490px] text-center" style="background-color: {classColor}">
				<span class="text-lg font-semibold">{classType} Class</span>
			</div>
		</div>
	</section>

	<button class="navigation flex-1 bg-black h-[4.5rem] w-[3.5rem] rounded-md" aria-label="previous car"
					disabled={arrowsDisabled[1]}
					onclick={() => {carCurrent++; console.log(carCurrent)}}>
		<i class="bi bi-chevron-right text-[3rem]" style="color: var(--color-primary)"></i></button>
</section>

<!-- Legend -->
<section class="flex justify-center mb-[2rem]">
	<div class="flex gap-6 items-center">
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded border-2 border-gray-300" style="background-color: #e5e7eb;"></div>
			<span class="font-semibold">Available</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded border-2" style="background-color: var(--color-accent); border-color: var(--color-accent);"></div>
			<span class="font-semibold">Selected</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded border-2 border-gray-300" style="background-color: #9ca3af;"></div>
			<span class="font-semibold">Unavailable</span>
		</div>
	</div>
</section>

<!-- Seating Arrangement -->
<section class="flex justify-center">
	<section class="white !p-[3rem] seating-container flex flex-col gap-6">
		<!-- Row A: 8 seats -->
		<div class="seat-row flex gap-3">
			{#each Array(8) as _, i}
				{@const seatId = `A${i + 1}`}
				<button
					class="seat"
					class:selected={isSeatSelected(seatId)}
					class:available={!isSeatSelected(seatId) && !isSeatUnavailable(seatId)}
					disabled={isSeatUnavailable(seatId)}
					onclick={() => toggleSeat(seatId)}
					aria-label="Seat {seatId}">
					{seatId}
				</button>
			{/each}
		</div>

		<!-- Aisle -->
		<div class="aisle h-8 flex items-center justify-center text-gray-400">
			<span>AISLE</span>
		</div>

		<!-- Row B: 8 seats -->
		<div class="seat-row flex gap-3">
			{#each Array(8) as _, i}
				{@const seatId = `B${i + 1}`}
				<button
					class="seat"
					class:selected={isSeatSelected(seatId)}
					class:available={!isSeatSelected(seatId) && !isSeatUnavailable(seatId)}
					disabled={isSeatUnavailable(seatId)}
					onclick={() => toggleSeat(seatId)}
					aria-label="Seat {seatId}">
					{seatId}
				</button>
			{/each}
		</div>
	</section>
</section>

<!-- Selected Seats Display -->
<section class="p-[2rem] mx-[5rem] flex justify-center">
	<div>
		<h3 class="font-bold mb-2">Selected Seats:
			<span class="text-[var(--color-accent)]">({selectedSeats.length} out of {seats})</span>
		</h3>
		{#if selectedSeats.length === 0}
			<p class="text-gray-500">No seats selected</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each selectedSeats as seat}
					<span class="bg-[var(--color-accent)] text-white px-3 py-1 rounded">
						Car {seat.car} - {seat.seat}
					</span>
				{/each}
			</div>
		{/if}
	</div>
</section>

<section class="footer fixed bottom-0 left-0 right-0 flex flex-row justify-between px-8 py-2 50">
	<a href="/" class="px-6 py-3  text-black  font-semibold hover:underline transition">
		<i class="bi bi-caret-left-fill !mr-[1rem] !text-black"></i> Back</a>
	<a href="/book/step3-confirmation" class="px-6 py-3  text-[var(--color-accent)]  font-semibold hover:underline transition">
		Proceed to Confirmation <i class="bi bi-caret-right-fill !ml-[1rem] !text-[var(--color-accent)]"></i> </a>
</section>

<style>
	button.navigation:hover {
			box-shadow: black 0 0 5px;
	}
	button.navigation:disabled,
	button.navigation:disabled:hover{
			background-color: var(--color-outline);
      box-shadow: none;
			cursor: not-allowed;
	}

	.seat {
		width: 60px;
		height: 60px;
		background-color: #e5e7eb;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.seat.available:hover {
		background-color: #d1d5db;
		transform: scale(1.05);
	}

	.seat.selected {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
		color: white;
	}

	.seat.selected:hover {
		transform: scale(1.05);
	}

	.seat:disabled {
		background-color: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
		color: white;
	}
</style>