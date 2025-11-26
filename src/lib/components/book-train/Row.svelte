<script>
import ClassType from '$lib/components/book-train/ClassType.svelte';

export let train;
export let classType;
export let urlInfo;
export let capacity;

// Map class type to capacity index
const classIndex = {
	'First': 0,
	'Business': 1,
	'Economy': 2
};

</script>
<hr>
<div class="row flex flex-row my-2">
	<span class="flex-2">{train.name}</span>
	<span class="flex-1">{train.departs}</span>
	<span class="flex-1">{train.arrives}</span>
	<span class="flex-2">
			<ClassType type={classType} {capacity} {urlInfo} {train} />
	</span>
</div>
