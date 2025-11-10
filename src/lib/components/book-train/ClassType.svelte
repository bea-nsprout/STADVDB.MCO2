<script lang="ts">
	import { goto } from '$app/navigation';

	export let urlInfo;
	export let type="Economy";
	export let capacity=10;
	let color = "";

	if (type === "First") {
		color = "var(--color-accent)";
	} else if (type === "Business") {
		color = "#929292";
	} else {
		color = "black";
	}
</script>

<button style="background-color: {color}" class="flex flex-row justify-between px-1 rounded-s"
	on:click={() => goto(`/book/step2-seats?train=${urlInfo.train || ''}&class=${type}&seats=${urlInfo.psngrCount || 0}&to=${urlInfo.to || ''}&from=${urlInfo.from || ''}`)}>
	<span class="text-white text-[0.8rem]">{type} Class</span>
	<span class="bg-white h-[80%] text-[0.7rem] w-[1rem] mt-0.5 rounded-xs">{capacity}</span>
</button>

<style>
	button:hover {
		box-shadow: black 0 0 5px;
	}
</style>
