<script lang="ts">
	import TrainMap from '$lib/components/TrainMap.svelte';
	import Header from '$lib/components/Header.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Row from '$lib/components/book-train/Row.svelte';
	import { getStations, getStationIndex } from '$lib/data/stations';
	import { bookingStore } from '$lib/stores/booking';
	import type { PageData } from './$types';
	import type { Train } from '$lib/types/train';

	let { data }: { data: PageData } = $props();

	let stationsMenu = getStations()
	let trains: Train[] = $state(data.trains)
	let isSearching = $state(false)
	let hasSearched = $state(false)

	async function searchTrains() {
		if (!form.stationFrom || !form.stationTo || !form.classType) {
			return; // Don't search if required fields are missing
		}

		isSearching = true;

		// Build query parameters
		const params = new URLSearchParams();
		console.log(form.stationFrom, form.stationTo)
		params.append('from', form.stationFrom);
		params.append('to', form.stationTo);
		params.append("type", (form.filterType === "Departs at") ? "departure" : "arrival");
		params.append("cls", form.classType)
		if (form.timeStart) {
			const date = new Date(form.timeStart);
			params.append('timeStart', date.toISOString());
			const endDate = date
			endDate.setHours(endDate.getHours() + 1);
			params.append('timeEnd', endDate.toISOString());
		}

		try {
			const response = await fetch(`/api/trainSchedules?${params}`);
			const data = await response.json();
			console.log(data)
			trains = data as Train[];
		} catch (error) {
			console.error('Error fetching trains:', error);
		} finally {
			const testparams = new URLSearchParams();
			testparams.append('from', form.stationFrom);
			testparams.append('to', form.stationTo);
			testparams.append("cls", form.classType)
			testparams.append('journey', trains[0].journey_id.toString());
			const testres = await fetch(`/api/trainTickets?${testparams}`);
			const testdata = await testres.json();
			console.log(testdata)
			isSearching = false;
			hasSearched = true;
		}
	}

	// Get current date and time in datetime-local format (YYYY-MM-DDTHH:mm)
	const now = new Date();
	const defaultDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16);

	// Initialize form from store if values exist, otherwise use defaults
	let form = $state({
		stationFrom: $bookingStore.stationFrom || "",
		stationTo: $bookingStore.stationTo || "",
		psngrCount: $bookingStore.passengers || 1,
		timeStart: $bookingStore.timeStart || defaultDateTime,
		classType: $bookingStore.classType || "",
		filterType: $bookingStore.filterType || "Departs at"
	})

	// Sync form changes to store
	$effect(() => {
		const dateObj = form.timeStart ? new Date(form.timeStart) : new Date();
		const formattedDate = dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		bookingStore.update(store => ({
			...store,
			stationFrom: form.stationFrom,
			stationTo: form.stationTo,
			passengers: form.psngrCount,
			timeStart: form.timeStart,
			filterType: form.filterType,
			classType: form.classType,
			date: formattedDate
		}));
	});

	let stationFromIndex = $derived(getStationIndex(form.stationFrom))
	let stationToIndex = $derived(getStationIndex(form.stationTo))

	const timeEnd = $derived.by(() => {
		if (!form.timeStart) return "";
		const date = new Date(form.timeStart);
		date.setHours(date.getHours() + 1);
		return date.toTimeString().slice(0, 5); // Returns "HH:mm"
	})

	// Validation states
	const isFormValid = $derived(form.stationFrom !== "" && form.stationTo !== "" && form.psngrCount >= 1)
	const shouldShowResults = $derived(form.stationFrom !== "" && form.stationTo !== "")

	// TODO: replace this entire thing?? but the logic is kinda like this 
	// Filter trainSchedules based on form inputs
	const filteredTrains = $derived.by(() => {
		if (!shouldShowResults) return ([] as Train[]);
		 return trains
		// return trains.filter(train => {
		// 	// Check capacity based on selected class type
		// 		const capacity = train.capacity;
		// 		if (capacity < form.psngrCount) return false;


		// 	// Filter by time if provided
		// 	if (form.timeStart) {
		// 		const filterTime = new Date(form.timeStart);
		// 		const filterTimeStr = filterTime.toTimeString().slice(0, 5); // "HH:mm"

		// 		// Compare time based on filter type
		// 		if (form.filterType === "Departs at") {
		// 			if (train.departs < filterTimeStr) return false;
		// 		} else if (form.filterType === "Arrives at") {
		// 			if (train.arrives < filterTimeStr) return false;
		// 		}
		// 	}

		// 	return true;
		// });
	})
</script>

<Header />
<TrainMap stationFrom={stationFromIndex} stationTo={stationToIndex} />

<article class="train-map-right">
	<section class="white flex flex-col gap-[1rem]">

		<div class="flex flex-row ">
			<span class="label"><b>Station</b></span>
			<div class="flex flex-wrap w-[620px] gap-auto">
				<SearchFilter fieldname="From" menuItems={stationsMenu} bind:value={form.stationFrom}/>
				<span class="flex-1 min-w-0"><i class="bi bi-arrow-right"></i></span>
				<SearchFilter fieldname="To" menuItems={stationsMenu} bind:value={form.stationTo}/>
			</div>
		</div>

		<hr>

		<div class="flex flex-row ">
			<span class="label"><b>Departs at</b></span>

			<div class="flex flex-wrap w-[620px]">
				<input class="flex-1.5 min-w-0 w-[300px]" type="datetime-local" bind:value={form.timeStart}>
				<i class="bi bi-arrow-right"></i>
				<input class="flex-1 min-w-0" type="time" value={timeEnd} disabled>
			</div>
		</div>

		<hr>

		<div class="flex flex-row gap-3">
			<span class="flex flex-row">
				<span class="label"><b>Seat Class</b></span>

				<div class="flex flex-wrap w-[300px]">
					<select class="flex-1 min-w-0 !py-0 " bind:value={form.classType}>
						<option value="First">First Class</option>
						<option value="Business">Business Class</option>
						<option value="Economy">Economy Class</option>
					</select>
				</div>
			</span>

			<span class="flex flex-row">
				<span class="label"><b>Seat Count</b></span>
				<div class="flex flex-row w-[120px] ">
					<input
						type="number"
						min="1"
						max="6"
						bind:value={form.psngrCount}
						class:border-red-400={form.psngrCount < 1}
					>
					{#if form.psngrCount < 1}
						<span class="text-red-500 text-sm self-center ml-2">Minimum 1 passenger</span>
					{/if}
				</div>
			</span>
		</div>

		<hr>

		<div class="flex flex-row justify-end">
			<button
				class="px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={searchTrains}
				disabled={!isFormValid || isSearching}
			>
				{#if isSearching}
					<i class="bi bi-hourglass-split !text-white"></i> Searching...
				{:else}
					<i class="bi bi-search !text-white"></i> Search Trains
				{/if}
			</button>
		</div>

	</section>

	<br>

	<section class="white">
		{#if !hasSearched}
			<!-- Empty state: No search performed yet -->
			<div class="flex flex-col items-center justify-center py-12 text-gray-500">
				<i class="bi bi-train-front text-6xl mb-4"></i>
				<p class="text-xl font-semibold">Select stations to search for trains</p>
				<p class="text-sm">Choose your departure and arrival stations above</p>
			</div>
		{:else if hasSearched && filteredTrains.length === 0}
			<!-- Empty state: No trainSchedules match criteria -->
			<div class="flex flex-col items-center justify-center py-12 text-gray-500">
				<i class="bi bi-exclamation-circle text-6xl mb-4 text-orange-400"></i>
				<p class="text-xl font-semibold">No trains available</p>
				<p class="text-sm">Try adjusting your search criteria or time range</p>
			</div>
		{:else if hasSearched}
			<!-- Train results -->
			<section class="flex flex-row text-[var(--color-accent)] font-bold mx-[1.25rem]">
				<span class="flex-2">Train Name</span>
				<span class="flex-1">Departs</span>
				<span class="flex-1">Arrives</span>
				<span class="flex-2 flex flex-col gap-1">Capacity</span>
			</section>

			{#each filteredTrains as train}
				<Row {train} classType={form.classType}
						 urlInfo={{train: train.name, psngrCount: form.psngrCount, from: form.stationFrom, to: form.stationTo}} />
			{/each}
		{/if}
	</section>
</article>


<style>
	.label {
			width: 105px;
	}
</style>