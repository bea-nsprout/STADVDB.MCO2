<script lang="ts">
	// 2D array: heatmapData[dayOfWeek][hour]
	// dayOfWeek: 0 = Sunday, 6 = Saturday
	// hour: 0-23
	export let heatmapData: number[][] = [];

	const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	// Operating hours: 1-9 UTC (9am-5pm GMT+8)
	const operatingHours = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const hourLabels = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];

	// Get min and max values from the data for color scaling
	$: flatData = heatmapData.flat();
	$: minValue = Math.min(...flatData.filter(v => v > 0));
	$: maxValue = Math.max(...flatData);
	$: valueRange = maxValue - minValue;

	// Interpolate between two colors based on intensity
	function getHeatColor(value: number) {
		if (value === 0) {
			return 'rgb(245, 245, 245)'; // Light gray for no data
		}

		// Normalize value to 0-1 range based on min/max
		let intensity = 0;
		if (valueRange > 0) {
			intensity = (value - minValue) / valueRange;
		}

		// Start color: light orange
		const startR = 255, startG = 220, startB = 180;

		// End color: dark orange (accent color) #FE6400
		const endR = 254, endG = 100, endB = 0;

		// Linear interpolation
		const r = Math.round(startR + (endR - startR) * intensity);
		const g = Math.round(startG + (endG - startG) * intensity);
		const b = Math.round(startB + (endB - startB) * intensity);

		return `rgb(${r}, ${g}, ${b})`;
	}
</script>

<div class="heatmap-container">
	<div class="heatmap-grid">
		<!-- Header row with hour labels -->
		<div class="cell header-cell corner-cell"></div>
		{#each hourLabels as hour}
			<div class="cell header-cell">{hour}</div>
		{/each}

		<!-- Data rows -->
		{#each daysOfWeek as day, dayIndex}
			<!-- Day label -->
			<div class="cell day-label">{day}</div>

			<!-- Hour cells for this day -->
			{#each operatingHours as hour}
				{@const value = heatmapData[dayIndex]?.[hour] || 0}
				<div
					class="cell data-cell"
					style="background-color: {getHeatColor(value)}"
					title="{day} {hourLabels[operatingHours.indexOf(hour)]}: {value} reservations"
				>
					<span class="cell-value">{value}</span>
				</div>
			{/each}
		{/each}
	</div>

	<!-- Legend -->
	<div class="legend">
		<span class="text-sm">Low</span>
		<div class="gradient-bar"></div>
		<span class="text-sm">High</span>
		<span class="text-sm ml-4">Max: {maxValue}</span>
	</div>
</div>

<style>
	.heatmap-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
	}

	.heatmap-grid {
		display: grid;
		grid-template-columns: 120px repeat(9, 70px);
		gap: 2px;
		background-color: var(--color-outline);
		padding: 2px;
		border-radius: 8px;
	}

	.cell {
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 50px;
		padding: 0.5rem;
		font-size: 0.875rem;
	}

	.header-cell {
		font-weight: bold;
		background-color: var(--color-background);
		color: var(--color-secondary);
	}

	.corner-cell {
		background-color: var(--color-background);
	}

	.day-label {
		font-weight: 600;
		background-color: var(--color-background);
		color: var(--color-secondary);
		justify-content: flex-start;
		padding-left: 1rem;
	}

	.data-cell {
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		position: relative;
	}

	.data-cell:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		z-index: 10;
	}

	.cell-value {
		font-weight: 600;
		color: var(--color-secondary);
		font-size: 0.875rem;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.gradient-bar {
		width: 200px;
		height: 12px;
		background: linear-gradient(to right,
			rgb(255, 220, 180),
			rgb(254, 100, 0)
		);
		border: 1px solid var(--color-outline);
		border-radius: 5px;
	}

	.text-sm {
		font-size: 0.875rem;
		color: var(--color-outline);
	}

	.ml-4 {
		margin-left: 1rem;
	}
</style>
