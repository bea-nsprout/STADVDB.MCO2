<script>
	export let inputValue = "";
</script>

<style>
    /* The search field */
    #searchInput {
        box-sizing: border-box;
        font-size: 1rem;
        padding: 0.25rem 3rem 0.25rem 0.5rem;
        border: none;
        border-bottom: 1px solid #ddd;
    }
    #searchInput:focus {outline: 3px solid #ddd;}

    #search-icon {
        position: absolute;
				top: 0.25rem;
        font-size: 1rem;
    }
</style>


<input type="text" placeholder="Search..." autocomplete="off" id="searchInput" bind:value={inputValue} on:input>
