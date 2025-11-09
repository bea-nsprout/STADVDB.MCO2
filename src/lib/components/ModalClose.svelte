<script lang="ts">
	export let isOpen = false;
	export let modalClass = "";
</script>

{#if isOpen}
	<button class="modalclose w-full h-full {modalClass}"
					on:click={() => isOpen=false}
					aria-label="close">
	</button>
{/if}

<style>
	.modalclose {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1;
	}
</style>