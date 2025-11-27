<script lang="ts">
import ClassType from '$lib/components/book-train/ClassType.svelte';
import type { Train } from '$lib/types/train';

export let train: Train;
export let classType;
export let urlInfo;
export let capacity;

// Map class type to capacity index
const classIndex = {
	'First': 0,
	'Business': 1,
	'Economy': 2
};

function dateFormatter(str: string): string {
	const unfmt =  new Date(str)
	const fmtr = new Intl.DateTimeFormat('en-PH', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
		timeZone: 'Asia/Manila'
	})
	return fmtr.format(unfmt)
}

</script>
<hr>
<div class="row flex flex-row my-2">
	<span class="flex-2">{train.name}</span>
	<span class="flex-1">{dateFormatter(train.departs)}</span>
	<span class="flex-1">{dateFormatter(train.arrives)}</span>
	<span class="flex-2">
			<ClassType type={classType} {capacity} {urlInfo} {train} />
	</span>
</div>
