<script>
import ClassType from '$lib/components/book-train/ClassType.svelte';

export let train = {
	name: "Thomas the Train",
	departs: "2:31 AM",
	arrives: "3:59 AM",
	capacity: [18, 64, 80]
}
</script>
<hr>
<div class="row flex flex-row my-2">
	<span class="flex-2">{train.name}</span>
	<span class="flex-1">{train.departs}</span>
	<span class="flex-1">{train.arrives}</span>
	<span class="flex-2 flex flex-col gap-1">
				<ClassType type="First" capacity={train.capacity[0]} />
				<ClassType type="Business" capacity={train.capacity[1]} />
				<ClassType type="Economy" capacity={train.capacity[2]} />
			</span>
</div>
