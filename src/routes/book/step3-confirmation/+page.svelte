<script lang="ts">
	import { bookingStore } from '$lib/stores/booking';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import TrainMapHorizontal from '$lib/components/TrainMapHorizontal.svelte';
	import ReceiptTemplate from '$lib/components/book-train/ReceiptTemplate.svelte';
	import { getStations, getStationIndex } from '$lib/data/stations';
	import { getFare } from '$lib/data/farematrix.ts';




	// Props (Svelte 5 runes mode)
	let { form }: { form: ActionData } = $props();

	// Load booking data from store
	let booking = $state($bookingStore);

	// Form fields
	let email = $state('');

	let stationFromIndex = $derived(getStationIndex(booking.stationFrom))
	let stationToIndex = $derived(getStationIndex(booking.stationTo))
	let price = getFare(stationFromIndex, stationToIndex, booking.classType);
	let priceTotal = (price ?? 0) * booking.selectedSeats.length;

	// Construct URL for back navigation with all booking data
	const backToSeatsUrl = $derived(
		`/book/step2-seats?train=${booking.train}&class=${booking.classType}&seats=${booking.passengers}&from=${booking.stationFrom}&to=${booking.stationTo}`
	);

	
</script>

{#if form?.success}
	<!-- Success Message -->
	<section class="white w-[85%] mx-auto mt-[2rem] mb-[1rem] !p-[2rem]">
		<div class="flex flex-col items-center gap-4">
			<i class="bi bi-check-circle text-6xl text-green-600"></i>
			<h1 class="text-3xl font-bold text-green-600">Booking Confirmed!</h1>
		</div>
	</section>

	<!-- Receipts - One per seat -->
	<section class="w-[85%] mx-auto mb-[2rem] flex flex-col gap-4">
		{#each booking.selectedSeats as seat}
			<ReceiptTemplate booking={{...booking, selectedSeats: [seat]}} />
		{/each}
	</section>

	<section class="w-[85%] mx-auto mb-[4rem] flex justify-center">
		<a href="/" class="px-6 py-3 bg-[var(--color-accent)] text-white rounded-md font-semibold hover:opacity-90 transition">
			Back to Home
		</a>
	</section>
{:else}
	<!-- Booking Form -->
	<section class="white w-[85%] mx-auto mt-[2rem] mb-[1rem]">
		<h1 class="text-2xl font-bold p-4">Confirm Your Booking</h1>
		<TrainMapHorizontal stationFrom={stationFromIndex} stationTo={stationToIndex} />
	</section>

	<article class="w-[85%] mx-auto mb-[4rem]">
		<form method="POST" action="?/confirm" use:enhance>
			<section class="flex flex-row gap-[1rem]">
				<section class="white w-[70%] flex flex-col gap-[1rem] !p-[2rem]">

					{#if form?.error}
						<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
							{form.error}
						</div>
					{/if}

					<div class="flex flex-row">
						<span class="label"><b>Email</b></span>
						<input
							name="email"
							type="email"
							bind:value={email}
							required
							placeholder="your.email@example.com"
							class:border-red-500={form?.missing === 'email'}
							style="width: 20rem"
						/>
					</div>

					<hr>

					<div class="flex flex-row ">
						<span class="label"><b>Station</b></span>
						<div class="flex flex-wrap">
							<input value={booking.stationFrom} disabled/>
							<span class="flex-1 min-w-0"><i class="bi bi-arrow-right"></i></span>
							<input value={booking.stationTo} disabled/>
						</div>
					</div>

					<div class="flex flex-row ">
						<span class="label"><b>Train</b></span>
						<input value={booking.train} disabled />
					</div>

					<div class="flex flex-row ">
						<span class="label"><b>Class</b></span>
						<input value={booking.classType} disabled />
					</div>

					<div class="flex flex-row ">
						<span class="label"><b>Date</b></span>
						<input value={booking.date} disabled />
					</div>

					<div class="flex flex-row ">
						<span class="label"><b>Schedule</b></span>
						<div class="flex flex-wrap">
							<input value={booking.timeDepart} disabled style="width: 8rem"/>
							<span class="flex-1 min-w-0"><i class="bi bi-arrow-right"></i></span>
							<input value={booking.timeArrive} disabled style="width: 8rem"/>
						</div>
					</div>

					<div class="flex flex-row ">
						<span class="label"><b>Passengers</b></span>
						<input value={booking.passengers} disabled />
					</div>

					<!-- train seats -->
					<hr>
					<div class="flex flex-row">
						<span class="label"><b>Selected Seats</b></span>
						<div class="flex flex-col gap-2">
							{#if booking.selectedSeats.length === 0}
								<p class="text-red-500">No seats selected - please go back and select seats</p>
							{:else}
								<div class="flex flex-wrap gap-2">
									{#each booking.selectedSeats as seat}
									<span class="bg-[var(--color-accent)] text-white px-3 py-1 rounded">
										Car {seat.car} - {seat.seat}
									</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Hidden fields to pass booking data to server -->
					<input type="hidden" name="train" value={booking.train} />
					<input type="hidden" name="classType" value={booking.classType} />
					<input type="hidden" name="stationFrom" value={booking.stationFrom} />
					<input type="hidden" name="stationTo" value={booking.stationTo} />
					<input type="hidden" name="passengers" value={booking.passengers} />
					<input type="hidden" name="seats" value={JSON.stringify(booking.selectedSeats)} />
					<input type ="hidden" name = "cost_total" value = {priceTotal}>
					<input type="hidden" name="cost" value={price} />
					<input type="hidden" name="journey" value={booking.journey} />
					<input type="hidden" name="timeDepart" value="" />
					<input type="hidden" name="timeArrive" value="" />



				</section>

				<section class="total white flex-1 flex flex-col">
					<span class="flex flex-row justify-between mt-[1rem]"><span>{booking.classType} Class</span> <span>¥ {price}</span></span>
					<span class="flex flex-row justify-between mt-[1rem]"><span>Seats</span> <span>{booking.selectedSeats.length}</span></span>
					<hr>
					<span class="flex flex-row justify-between mt-[1rem] font-bold"><span>Total Amount</span> <span>¥ {priceTotal}</span></span>


					<span class="mt-auto text-center text-[0.9rem] text-[var(--color-accent)]">Please be sure to read.</span>
					<button type="submit"
						class="px-2 py-1 bg-[var(--color-accent)] text-white hover:opacity-90 transition w-full"
						disabled={booking.selectedSeats.length === 0} >
						CONFIRM BOOKING
					</button>

				</section>
			</section>
		</form>
	</article>

	<section class="footer fixed bottom-0 left-0 right-0 flex flex-row justify-between px-8 py-2 50 !bg-[var(--color-bg)]/80">
		<a href={backToSeatsUrl} class="px-6 py-3 text-black font-semibold hover:underline transition">
			<i class="bi bi-caret-left-fill !mr-[1rem] !text-black"></i> Back to Seat Selection
		</a>
	</section>
{/if}
