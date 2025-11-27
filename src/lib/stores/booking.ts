import { writable } from 'svelte/store';

export interface BookingData {
	train: string;
	classType: string;
	stationFrom: string;
	stationTo: string;
	passengers: number;
	selectedSeats: Array<{ car: number; seat: string }>;
	timeStart: string;
	filterType: string;
	date: string;
	timeDepart: string;
	timeArrive: string;
	cost: number;
}

const defaultBooking: BookingData = {
	train: '',
	classType: '',
	stationFrom: '',
	stationTo: '',
	passengers: 1,
	selectedSeats: [],
	timeStart: '',
	filterType: 'Departs at',
	date: '',
	timeDepart: '',
	timeArrive: '',
	cost: 0
};

export const bookingStore = writable<BookingData>(defaultBooking);

// Helper to reset the store
export function resetBooking() {
	bookingStore.set(defaultBooking);
}
