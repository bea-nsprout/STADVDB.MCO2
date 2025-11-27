// Database uses 1-indexed station IDs: 1=Tokyo, 2=Shin-Yokohama, ..., 6=Shin-Osaka
const stationMap = new Map([
	["Tokyo", 1],
	["Shin-Yokohama", 2],
	["Toyohashi", 3],
	["Nagoya", 4],
	["Kyoto", 5],
	["Shin-Osaka", 6],
]);

export function getStations() {
	return ["Tokyo", "Shin-Yokohama", "Toyohashi", "Nagoya", "Kyoto", "Shin-Osaka"]
}

export function getStationIndex(input:string) {
	return stationMap.get(input) ?? 1 // Default to Tokyo (1) if not found
}

export function getDirection(from: number, to: number): string {
	return from - to > 0 ? 'Eastbound' : 'Westbound';
}