<script>
	import Input from './Input.svelte';
	import ModalClose from '$lib/components/ModalClose.svelte';


	let menuOpen = false;
	let inputValue = "";
	$:console.log(inputValue);

	export let fieldname = "Field";
	export let value = "Select";
	export let menuItems = ["About", "Base", "Blog", "Contact", "Custom", "Support", "Tools", "Boats", "Cars", "Bikes", "Sheds", "Billygoats", "Zebras", "Tennis Shoes", "New Zealand"];
	let filteredItems = [];

	const handleInput = () => {
		return filteredItems = menuItems.filter(item => item.toLowerCase().match(inputValue.toLowerCase()));
	}
</script>

<ModalClose bind:isOpen={menuOpen}/>
<section class="dropdown">
	<button on:click={() => menuOpen = !menuOpen} class="dropbtn w-[15rem] text-[var(--color-outline)]">{fieldname}:&nbsp&nbsp&nbsp&nbsp{value} <i class="bi bi-caret-down-fill"></i></button>

	<div class:show={menuOpen} class="dropdown-content">
		<Input bind:inputValue on:input={handleInput} />
		<!-- MENU -->
		{#if filteredItems.length > 0}
			{#each filteredItems as item}
				<div><button class="p-[0.25rem] hover:bg-[var(--color-accent)] !text-[var(--color-secondary)] w-full text-left" on:click={() => value=item}>{item}</button></div>
			{/each}
		{:else}
			{#each menuItems as item}
				<div><button class="p-[0.25rem] hover:bg-[var(--color-accent)] !text-[var(--color-secondary)] w-full text-left" on:click={() => value=item}>{item}</button></div>
			{/each}
		{/if}
	</div>
</section>


<style>
    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-content {
        display: none;
        position: absolute;
				background-color: var(--color-bg);
        z-index: 2;
    }

    /* Show the dropdown menu */
    .show {display:block;}

		/* Dropdown Button */
     .dropbtn {
         border: var(--color-outline) solid 1px;
				 font-size: 0.9rem;
				 border-radius: 0.25rem;
         cursor: pointer;
     }

    /* Dropdown button on hover & focus */
    .dropbtn:hover, .dropbtn:focus {
        color: var(--color-accent) !important;
        border: var(--color-accent) solid 1px;
    }

</style>