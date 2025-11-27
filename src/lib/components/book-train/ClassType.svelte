<script lang="ts">
	import { goto } from '$app/navigation';
	import { bookingStore } from '$lib/stores/booking';
	import type { Train } from '$lib/types/train';

	export let urlInfo: {train: string, psngrCount: string, from: string, to: string};
	export let train: Train;
	export let type="Economy";
	let color = "";

	if (type === "First") {
		color = "var(--color-accent)";
	} else if (type === "Business") {
		color = "#929292";
	} else {
		color = "black";
	}

	function handleClick() {
		// Update store with train schedule info
		bookingStore.update(store => ({
			...store,
			timeDepart: train.departs,
			timeArrive: train.arrives,
			journey: train.journey_id.toString(),
			train: train.name
		}));

		goto(`/book/step2-seats?train=${urlInfo.train || ''}&class=${type}&seats=${urlInfo.psngrCount || 0}&to=${urlInfo.to || ''}&from=${urlInfo.from || ''}`);
	}
</script>

<button style="background-color: {color}" class="flex flex-row justify-between px-1 rounded-s"
	on:click={handleClick}>
	<span class="text-white text-[0.8rem]">{type} Class</span>
	<!-- <span class="bg-white h-[80%] text-[0.7rem] w-[1rem] mt-0.5 rounded-xs">{capacity}</span> -->
</button>

<style>
	button:hover {
		box-shadow: black 0 0 5px;
	}
</style>
