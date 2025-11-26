<script>
	// Array of values for each station (0-100 scale)
	// Example: [20, 45, 78, 90, 65, 30]
	export let heatmapData = [0, 0, 0, 0, 0, 0];
	export let showLabels = true;

	const stations = ['Tokyo', 'Shin-Yokohama', 'Toyohashi', 'Nagoya', 'Kyoto', 'Shin-Osaka'];

	// Get min and max values from the data
	$: minValue = Math.min(...heatmapData);
	$: maxValue = Math.max(...heatmapData);
	$: valueRange = maxValue - minValue;

	// Interpolate between two colors based on intensity (0-100)
	function getHeatColor(value) {
		// Normalize value to 0-1 range based on min/max
		let intensity = 0;
		if (valueRange > 0) {
			intensity = (value - minValue) / valueRange;
		}

		// Start color: white #FFFFFF
		const startR = 255, startG = 255, startB = 255;

		// End color: var(--color-accent) #FE6400
		const endR = 254, endG = 100, endB = 0;

		// Linear interpolation
		const r = Math.round(startR + (endR - startR) * intensity);
		const g = Math.round(startG + (endG - startG) * intensity);
		const b = Math.round(startB + (endB - startB) * intensity);

		return `rgb(${r}, ${g}, ${b})`;
	}
</script>

<div class="station-line-horizontal flex flex-row justify-center">
	{#each stations as station, i}
		<div class="station-item-horizontal">
			<div
				class="station-horizontal"
				style="background-color: {getHeatColor(heatmapData[i])}"
			>
				{#if i < stations.length - 1}
					<div class="line-segment-horizontal"></div>
				{/if}
			</div>
			<div class="station-info">
				<span class="station-name-horizontal">
					{station}
				</span>
				{#if showLabels}
					<span class="station-value">
						{heatmapData[i]}
					</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- Legend -->
<div class="legend flex items-center justify-center gap-2 mt-4">
	<span class="text-sm">Low</span>
	<div class="gradient-bar"></div>
	<span class="text-sm">High</span>
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
		border: 2px solid black;
		transition: all 0.3s ease;
		position: relative;
		flex-shrink: 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.station-horizontal:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.station-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.station-name-horizontal {
		font-weight: bold;
		font-size: 1rem;
		white-space: nowrap;
		color: var(--color-secondary);
		text-align: center;
	}

	.station-value {
		font-size: 0.75rem;
		color: var(--color-outline);
		font-weight: normal;
	}

	.line-segment-horizontal {
		position: absolute;
		height: 6px;
		width: 100px;
		background-color: black;
		top: 50%;
		left: 30px;
		transform: translateY(-50%);
		transition: all 0.3s ease;
	}

	.station-item-horizontal:not(:last-child) {
		margin-right: 100px;
	}

	.legend {
		margin-top: 1rem;
	}

	.gradient-bar {
		width: 150px;
		height: 10px;
		background: linear-gradient(to right,
			rgb(255, 255, 255),
			rgb(254, 100, 0)
		);
		border: 1px solid var(--color-outline);
		border-radius: 5px;
	}
</style>
