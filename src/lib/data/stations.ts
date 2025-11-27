const stationMap = new Map([
	["Tokyo", 0],
	["Shin-Yokohoma", 1],
	["Toyohashi", 2],
	["Nagoya", 3],
	["Kyoto", 4],
	["Shin-Osaka", 5],
]);

export function getStations() {
	return ["Tokyo", "Shin-Yokohoma", "Toyohashi", "Nagoya", "Kyoto", "Shin-Osaka"]
}

export function getStationIndex(input:string) {
	return (stationMap.get(input) ?? 0) + 1
}

export function getDirection(from: number, to: number): string {
	return from - to > 0 ? 'Eastbound' : 'Westbound';
}