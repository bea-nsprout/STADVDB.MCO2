// Base fare matrix: fareMatrix[from][to]
const baseFareMatrix = [
	[0,    1000, 3000, 3500, 5000, 5500], // Tokyo
	[1000, 0,    2500, 3000, 4500, 5000], // Shin-Yokohoma
	[3000, 2500, 0,    1000, 2500, 3000], // Toyohashi
	[3500, 3000, 1000, 0,    2000, 2500], // Nagoya
	[5000, 4500, 2500, 2000, 0,    1000], // Kyoto
	[5500, 5000, 3000, 2500, 1000, 0   ]  // Shin-Osaka
];
const classMultipliers = [2.0, 1.5, 1.0]; // Economy, Business, First

// Fare lookup function
export function getFare(fromIndex, toIndex, classIndex) {
	const baseFare = baseFareMatrix[fromIndex]?.[toIndex];
	const multiplier = classMultipliers[classIndex];
	if (baseFare == null || multiplier == null) return null;
	return Math.round(baseFare * multiplier);
}