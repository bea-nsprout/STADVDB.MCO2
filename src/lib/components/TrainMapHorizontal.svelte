<script>
	export let stationFrom = 0;
	export let stationTo = 3;

	const stations = ['Tokyo', 'Shin-Yokohama', 'Toyohashi', 'Nagoya', 'Kyoto', 'Shin-Osaka'];

	$: minStation = Math.min(stationFrom, stationTo);
	$: maxStation = Math.max(stationFrom, stationTo);

	function isStationActive(index) {
		return index >= minStation && index <= maxStation;
	}

	function isLineSegmentActive(index) {
		return index >= minStation && index < maxStation;
	}
</script>

<div class="station-line-horizontal flex flex-row  justify-center">
	{#each stations as station, i}
		<div class="station-item-horizontal">
			<div class="station-horizontal" class:active={isStationActive(i)}>
				{#if i < stations.length - 1}
					<div class="line-segment-horizontal" class:active={isLineSegmentActive(i)}></div>
				{/if}
			</div>
			<span class="station-name-horizontal" class:active={isStationActive(i)}>
				{station}
			</span>
		</div>
	{/each}
</div>

<style>
	.station-line-horizontal {
		align-items: center;
	}

	.station-item-horizontal {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		position: relative;
		flex-shrink: 0;
		width: 30px;
	}

	.station-horizontal {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background-color: black;
		transition: background-color 0.2s;
		position: relative;
		flex-shrink: 0;
	}

	.station-horizontal.active {
		background-color: var(--color-accent);
	}

	.station-name-horizontal {
		font-weight: bold;
		font-size: 1rem;
		white-space: nowrap;
		transition: color 0.2s;
		color: black;
		text-align: center;

	}

	.station-name-horizontal.active {
		color: var(--color-accent);
	}

	.line-segment-horizontal {
		position: absolute;
		height: 6px;
		width: 100px;
		background-color: black;
		top: 50%;
		left: 30px;
		transform: translateY(-50%);
		transition: background-color 0.2s;
	}

	.station-item-horizontal:not(:last-child) {
		margin-right: 100px;
	}

	.line-segment-horizontal.active {
		background-color: var(--color-accent);
	}
</style>
