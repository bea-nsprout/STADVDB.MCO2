export interface Train {
	id: string;
	departs: string;
	arrives: string;
	capacity: [number, number, number]; // [First, Business, Economy]
}
