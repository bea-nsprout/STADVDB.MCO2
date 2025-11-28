<script lang="ts">
    let names:string[] = [];
	import Header from '$lib/components/Header.svelte';
    import TrainMap from '$lib/components/TrainMap.svelte';
    import SearchBar from '$lib/components/SearchBar.svelte';

   export let data: { names: string[] };
   names = data.names ?? [];
   
</script>

<div> <!--Container Div-->
   <Header/>
   <div class = "flex flex-row gap-x-30">
        <TrainMap/>
        <div class = "mt-20 flex flex-col gap-y-5" id = "labelsearchBar"> <!--Label and Search Bar-->
            <div class = "text-3xl font-bold text-[var(--color-accent)]">
                Search Email
            </div>
            <div>
                <SearchBar dataList = {names}/>
            </div>

        </div>
    </div>
</div>
<style>
    #labelsearchBar {
        margin-left: 50%;
    }
</style>