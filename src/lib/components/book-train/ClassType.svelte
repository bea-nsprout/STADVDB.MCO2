<script lang="ts">
	export let type="Economy";
	export let capacity=10;
	let color = "";

	if (type === "First") {
		color = "[var(--color-accent)]";
	} else if (type === "Business") {
		color = "[#929292]";
	} else {
		color = "black";
	}
</script>

<button class="!bg-{color} flex flex-row justify-between px-1 rounded-s">
	<span class="text-white text-[0.8rem]">{type} Class</span>
	<span class="bg-white h-[80%] text-[0.7rem] w-[1rem] mt-0.5 rounded-xs">{capacity}</span>
</button>