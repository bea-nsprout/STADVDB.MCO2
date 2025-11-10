<script lang="ts">
	import TrainMap from '$lib/components/TrainMap.svelte';
	import Header from '$lib/components/Header.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Row from '$lib/components/book-train/Row.svelte';
	import { getStations, getStationIndex } from '$lib/data/stations';

	let stationsMenu = getStations()

	let trains =
	[
		{
			id: "1000",
			name: "Thomas the Train",
			departs: "2:31 AM",
			arrives: "3:59 AM",
			capacity: [18, 64, 80]
		},
		{
			id: "1001",
			name: "Thomas the Train",
			departs: "3:32 AM",
			arrives: "4:53 AM",
			capacity: [18, 64, 80]
		},
		{
			id: "1002",
			name: "Thomas the Train",
			departs: "3:32 AM",
			arrives: "4:53 AM",
			capacity: [18, 64, 80]
		}
	]

	let form = $state({
		stationFrom: "",
		stationTo: "",
		psngrCount: 0,
		timeStart: ""
	})

	let stationFromIndex = $derived(getStationIndex(form.stationFrom))
	let stationToIndex = $derived(getStationIndex(form.stationTo))

	const timeEnd = $derived.by(() => {
		if (!form.timeStart) return "";
		const date = new Date(form.timeStart);
		date.setHours(date.getHours() + 1);
		return date.toTimeString().slice(0, 5); // Returns "HH:mm"
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
			<span class="label"><b>Schedule Filter</b></span>

			<div class="flex flex-wrap w-[620px]">
				<select class="flex-1 min-w-0 !py-0 mr-2">
					<option>Departs at</option>
					<option>Arrives at</option>
				</select>
				<input class="flex-1.5 min-w-0" type="datetime-local" bind:value={form.timeStart}>
				<i class="bi bi-arrow-right"></i>
				<input class="flex-1 min-w-0" type="time" value={timeEnd} disabled>
			</div>
		</div>

		<hr>

		<div class="flex flex-row ">
			<span class="label"><b>Passenger Count</b></span>

			<div class="flex flex-row w-[620px] gap-2">
				<input type="number" min="1" max="6" bind:value={form.psngrCount}>
			</div>
		</div>

	</section>

	<br>

	<section class="white">
		<section class="flex flex-row text-[var(--color-accent)] font-bold mx-[1.25rem]">
			<span class="flex-2">Train Name</span>
			<span class="flex-1">Departs</span>
			<span class="flex-1">Arrives</span>
			<span class="flex-2 flex flex-col gap-1">Capacity</span>
		</section>

		{#each trains as train}
			<Row {train} urlInfo={{train: train.id, psngrCount: form.psngrCount, from: form.stationFrom, to: form.stationTo}} />
		{/each}


	</section>
</article>