<script lang="ts">
	import Toggle from '$lib/components/Toggle.svelte';
	import Header from '$lib/components/Header.svelte';
	import TrainHeatmap from '$lib/components/reports/TrainHeatmap.svelte';
	import LineChart from '$lib/components/reports/LineChart.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let myToggle = $state(false);
	let stationDepartures = data.stationDepartures;
	let stationArrivals = data.stationArrivals;
	let reservationsPerClass = data.reservationsPerClass;
	let reservationsTotal = data.reservationsTotal;
	let revenuePerClass = data.revenuePerClass;
	let revenueTotal = data.revenueTotal;

	// Tab state for station heatmap
	let selectedTab = $state<'departures' | 'arrivals'>('departures');

	// Tab state for charts
	let reservationsView = $state<'total' | 'perClass'>('total');
	let revenueView = $state<'total' | 'perClass'>('total');

	// Colors for each class line
	const classColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
	const totalColor = ['var(--color-accent)']; // Orange for total

	// Calculate max Y values from totals for consistent scaling
	const maxReservations = $derived(Math.max(...reservationsTotal[0].data.map(d => d.reservations)));
	const maxRevenue = $derived(Math.max(...revenueTotal[0].data.map(d => d.revenue)));
</script>


<Header />

<!--Toggle for the admin view-->
<section class="white mx-[4rem] my-[2rem]" >
	<div class="flex items-center gap-2">
		<i class="bi bi-shield-lock"></i>
		<span>Admin View</span>
		<Toggle bind:checked={myToggle} />
	</div>
</section>

{#if myToggle}

	<!--Display reports-->
	<section id="reports" class="flex flex-col gap-[1rem] mx-[4rem]">

		<!--Report #1: Station Traffic with Tabs -->
		<section class="white">
			<!-- Tabs -->
			<div class="flex gap-2 mb-4 border-b border-gray-300">
				<button
					class="tab-button"
					class:active={selectedTab === 'departures'}
					onclick={() => selectedTab = 'departures'}
				>
					<i class="bi bi-box-arrow-right"></i>
					Station Departures
				</button>
				<button
					class="tab-button"
					class:active={selectedTab === 'arrivals'}
					onclick={() => selectedTab = 'arrivals'}
				>
					<i class="bi bi-box-arrow-in-right"></i>
					Station Arrivals
				</button>
			</div>

			<!-- Heatmap Content -->
			{#if selectedTab === 'departures'}
				<TrainHeatmap heatmapData={stationDepartures} />
			{:else}
				<TrainHeatmap heatmapData={stationArrivals} />
			{/if}
		</section>

		<!--Report #2: [LineChart] Number of Reservations for Class/Train per time period -->
		<section class="white">
			<h1><i class="bi bi-calendar-check icon-accent"></i> Reservations Over Time</h1>

			<!-- Tabs -->
			<div class="flex gap-2 mb-4 border-b border-gray-300">
				<button
					class="tab-button"
					class:active={reservationsView === 'total'}
					onclick={() => reservationsView = 'total'}
				>
					Total
				</button>
				<button
					class="tab-button"
					class:active={reservationsView === 'perClass'}
					onclick={() => reservationsView = 'perClass'}
				>
					Per Class
				</button>
			</div>

			<!-- Chart Content -->
			{#if reservationsView === 'total'}
				<LineChart
					data={reservationsTotal}
					colors={totalColor}
					maxYValue={maxReservations}
					yFormat=" reservations"
					yLabel="↑ Reservations"
					xUnit="date"
				/>
			{:else}
				<LineChart
					data={reservationsPerClass}
					colors={classColors}
					maxYValue={maxReservations}
					yFormat=" reservations"
					yLabel="↑ Reservations"
					xUnit="date"
				/>
			{/if}
		</section>

		<!--Report #3: [LineChart] Revenue by Class Over Time -->
		<section class="white">
			<h1><i class="bi bi-cash-stack icon-green"></i> Revenue Over Time</h1>

			<!-- Tabs -->
			<div class="flex gap-2 mb-4 border-b border-gray-300">
				<button
					class="tab-button"
					class:active={revenueView === 'total'}
					onclick={() => revenueView = 'total'}
				>
					Total
				</button>
				<button
					class="tab-button"
					class:active={revenueView === 'perClass'}
					onclick={() => revenueView = 'perClass'}
				>
					Per Class
				</button>
			</div>

			<!-- Chart Content -->
			{#if revenueView === 'total'}
				<LineChart
					data={revenueTotal}
					colors={totalColor}
					maxYValue={maxRevenue}
					yFormat="K"
					yLabel="↑ Revenue (in thousands)"
					xUnit="date"
				/>
			{:else}
				<LineChart
					data={revenuePerClass}
					colors={classColors}
					maxYValue={maxRevenue}
					yFormat="K"
					yLabel="↑ Revenue (in thousands)"
					xUnit="date"
				/>
			{/if}
		</section>

	</section>
{:else}
	<section class="white  mx-[4rem]">
		This is a group project by:
		<ul class="list-disc mx-[2rem]">
			<li><b>Helbling</b>, John Patrick</li>
			<li><b>Lingat</b>, Carl Blix</li>
			<li><b>Rivera</b>, Paolo Eugene</li>
			<li><b>Tan</b>, Ross David</li>
			<li><b>Uy</b>, Bea Antoinette</li>
		</ul>
	</section>
{/if}

<style>
	.icon-accent {
		color: var(--color-accent);
	}

	.icon-green {
		color: #22c55e;
	}

	.tab-button {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-weight: 500;
		color: var(--color-outline);
		transition: all 0.2s;
	}

	.tab-button .bi {
		color: inherit;
	}

	.tab-button:hover {
		color: var(--color-accent);
	}

	.tab-button.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}
</style>