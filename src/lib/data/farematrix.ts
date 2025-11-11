// Base fare matrix: fareMatrix[from][to]
import { getClassIndex } from '$lib/data/classTypes.ts';

const baseFareMatrix = [
	[0,    2500, 4500, 5000, 6500, 7000], // Tokyo
	[2500, 0,    4000, 4500, 6000, 6500], // Shin-Yokohoma
	[4500, 4000, 0,    2500, 4000, 4500], // Toyohashi
	[5000, 4500, 2500, 0,    3500, 4000], // Nagoya
	[6500, 6000, 4000, 3500, 0,    2500], // Kyoto
	[7000, 6500, 4500, 4000, 2500, 0   ]  // Shin-Osaka
];
const classMultipliers = [1.5, 2.0, 3.0]; // Economy, Business, First Class (respectively)

// Fare lookup function
export function getFare(fromIndex:number, toIndex:number, classType: string) {
	const baseFare = baseFareMatrix[fromIndex]?.[toIndex];
	const multiplier = classMultipliers[getClassIndex(classType)];	//gets the index from classTypes.ts
	if (baseFare == null || multiplier == null) return null;
	return Math.round(baseFare * multiplier);
}