<script lang="ts">
	import Header from '$lib/components/Header.svelte';
    import TrainMap from '$lib/components/TrainMap.svelte';
    import SearchBar from '$lib/components/SearchBar.svelte';
</script>

<div> <!--Container Div-->
   <Header/>
   <div class = "flex flex-row gap-x-30">
        <TrainMap/>
        <div class = "mt-20 flex flex-col gap-y-5"> <!--Label and Search Bar-->
            <div class = "text-3xl font-bold text-[var(--color-accent)]">
                Search Name
            </div>
            <div>
                <SearchBar/>
            </div>

        </div>
    </div>
</div>