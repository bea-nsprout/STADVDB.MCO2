<script>
	import TrainMap from '$lib/components/TrainMap.svelte';
	import Header from '$lib/components/Header.svelte';

	let stationsMenu = ["Tokyo", "Shin-Yokohoma", "Toyohashi", "Nagoya", "Kyoto", "Shin-Osaka"]
</script>

<Header />
<TrainMap />

<article class="train-map-right">
	<section class="white">
		<h2>Station</h2>
		<p>ScheduleFilter</p>
		<p>PassengerCount</p>
	</section>
</article>