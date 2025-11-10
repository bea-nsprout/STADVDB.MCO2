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
</style>