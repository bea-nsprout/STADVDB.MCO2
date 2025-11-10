import { writable } from 'svelte/store';

export interface BookingData {
	train: string;
	classType: string;
	stationFrom: string;
	stationTo: string;
	passengers: number;
	selectedSeats: Array<{ car: number; seat: string }>;
}

const defaultBooking: BookingData = {
	train: '',
	classType: '',
	stationFrom: '',
	stationTo: '',
	passengers: 0,
	selectedSeats: []
};

export const bookingStore = writable<BookingData>(defaultBooking);

// Helper to reset the store
export function resetBooking() {
	bookingStore.set(defaultBooking);
}
