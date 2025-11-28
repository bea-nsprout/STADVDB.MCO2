<script>
	import { fade } from 'svelte/transition';

	// Props are 1-indexed (1=Tokyo, 6=Shin-Osaka) from database
	export let stationFrom = 1;
	export let stationTo = 4;

	const stations = ['Tokyo', 'Shin-Yokohama', 'Toyohashi', 'Nagoya', 'Kyoto', 'Shin-Osaka'];

	const stationImages = [
		'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Tokyo_Station_Marunouchi_Building_P5228723.jpg/800px-Tokyo_Station_Marunouchi_Building_P5228723.jpg',
		'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Minato_Mirai_In_Blue.jpg/800px-Minato_Mirai_In_Blue.jpg',
		'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/ToyohashiSkyline03.jpg/800px-ToyohashiSkyline03.jpg',
		'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Nagoya_TV_Tower_%26_Spaceship-Aqua%2C_Higashisakura_Higashi_Ward_Nagoya_2020.jpg/800px-Nagoya_TV_Tower_%26_Spaceship-Aqua%2C_Higashisakura_Higashi_Ward_Nagoya_2020.jpg',
		'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Yasaka-dori_early_morning_with_street_lanterns_and_the_Tower_of_Yasaka_%28Hokan-ji_Temple%29%2C_Kyoto%2C_Japan.jpg/800px-Yasaka-dori_early_morning_with_street_lanterns_and_the_Tower_of_Yasaka_%28Hokan-ji_Temple%29%2C_Kyoto%2C_Japan.jpg',
		'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Osaka_Dotonbori_Ebisu_Bridge.jpg/800px-Osaka_Dotonbori_Ebisu_Bridge.jpg'
	];

	let hoveredIndex = null;
	// Convert 1-indexed to 0-indexed for array access
	let lastHoveredIndex = stationFrom - 1;

	// Preload all images
	if (typeof window !== 'undefined') {
		stationImages.forEach(src => {
			const img = new Image();
			img.src = src;
		});
	}

	// Convert 1-indexed props to 0-indexed for array operations
	$: minStation = Math.min(stationFrom - 1, stationTo - 1);
	$: maxStation = Math.max(stationFrom - 1, stationTo - 1);

	$: if (hoveredIndex !== null) {
		lastHoveredIndex = hoveredIndex;
	}

	$: currentIndex = hoveredIndex !== null ? hoveredIndex : lastHoveredIndex;
	$: currentImage = stationImages[currentIndex];

	function isStationActive(index) {
		if (hoveredIndex !== null) {
			return index === hoveredIndex;
		}
		return index >= minStation && index <= maxStation;
	}

	function isLineSegmentActive(index) {
		if (hoveredIndex !== null) {
			return false;
		}
		return index >= minStation && index < maxStation;
	}

	function isTextActive(index) {
		if (hoveredIndex !== null) {
			return index === hoveredIndex;
		}
		return index >= minStation && index <= maxStation;
	}
</script>

<section class="trainmap fixed left-0 top-0 h-screen w-2/5 overflow-hidden -z-1">
	{#key currentIndex}
		<img
			src={currentImage}
			class="h-full w-full object-cover absolute"
			alt={stations[currentIndex]}
			in:fade={{ duration: 1000 }}
			out:fade={{ duration: 1000 }}
		>
	{/key}
	<div class="gradient"></div>
</section>

<div class="station-line fixed left-[32%] top-1/2 -translate-y-1/2">
	{#each stations as station, i}
		<div
			class="station-item"
			on:mouseenter={() => hoveredIndex = i}
			on:mouseleave={() => hoveredIndex = null}
			role="button"
			tabindex="0"
		>
			<div
				class="station"
				class:active={isStationActive(i)}
				role="button"
				tabindex="0"
			>
				{#if i < stations.length - 1}
					<div class="line-segment" class:active={isLineSegmentActive(i)}></div>
				{/if}
			</div>
			<span
				class="station-name"
				class:active={isTextActive(i)}
				role="button"
				tabindex="0"
			>{station}</span>
		</div>
	{/each}
</div>

<style>
	.trainmap {
		position: fixed;
	}

	.station-line {
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.station-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 0;
		margin: -1.5rem 0;
		position: relative;
	}

	.station {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background-color: black;
		cursor: pointer;
		transition: background-color 0.2s;
		position: relative;
		flex-shrink: 0;
	}

	.station.active {
		background-color: var(--color-accent);
	}

	.station-name {
		font-weight: bold;
		font-size: 1.2rem;
		white-space: nowrap;
		cursor: pointer;
		transition: color 0.2s;
		color: black;
	}

	.station-name.active {
		color: var(--color-accent);
	}

	.line-segment {
		position: absolute;
		width: 6px;
		height: 3rem;
		background-color: black;
		left: 50%;
		top: 30px;
		transform: translateX(-50%);
		transition: background-color 0.2s;
	}

	.line-segment.active {
		background-color: var(--color-accent);
	}
	.gradient {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		background: linear-gradient(to right,
			rgba(243,243,243,0) 0%,
			rgba(243,243,243,0.09) 14%,
			rgba(243,243,243,0.5) 78%,
			rgba(243,243,243,0.9) 86%,
			rgba(243,243,243,1) 100%
		);
		pointer-events: none;
	}
</style>