import { writable } from 'svelte/store';

export interface BookingData {
	train: string;
	classType: string;
	stationFrom: string;
	stationTo: string;
	passengers: number;
	journey: string; // journey id
	selectedSeats: Array<{ car: number; col: number, row: number} >;
	timeStart: string;
	filterType: string;
	date: string;
	timeDepart: string;
	timeArrive: string;
	cost: number;
	email: string;
	cost_total: number;
}

const defaultBooking: BookingData = {
	train: '',
	classType: '',
	stationFrom: '',
	stationTo: '',
	passengers: 1,
	selectedSeats: [],
	journey: '', // journey id
	timeStart: '',
	filterType: 'Departs at',
	date: '',
	timeDepart: '',
	timeArrive: '',
	email: '',
	cost: 0,
	cost_total: 0,
};

export const bookingStore = writable<BookingData>(defaultBooking);

// Helper to reset the store
export function resetBooking() {
	bookingStore.set(defaultBooking);
}
