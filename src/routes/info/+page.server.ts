import type { PageServerLoad } from './$types';

// Helper to convert date strings to Date objects
function convertDates(data: any[]) {
	return data.map(series => ({
		...series,
		data: series.data.map((item: any) => ({
			...item,
			date: new Date(item.date)
		}))
	}));
}

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch station traffic data
		const trafficResponse = await fetch('/api/stationTraffic');
		const trafficData = await trafficResponse.json();

		// Fetch reservations data
		const reservationsResponse = await fetch('/api/reservations');
		const reservationsData = await reservationsResponse.json();

		// Fetch revenue data
		const revenueResponse = await fetch('/api/revenue');
		const revenueData = await revenueResponse.json();

		// Fetch reservations by time (heatmap)
		const reservationsByTimeResponse = await fetch('/api/reservationsByTime');
		const reservationsByTimeData = await reservationsByTimeResponse.json();

		return {
			stationDepartures: trafficData.stationDepartures || [],
			stationArrivals: trafficData.stationArrivals || [],
			reservationsPerClass: convertDates(reservationsData.reservationsPerClass || []),
			reservationsTotal: convertDates(reservationsData.reservationsTotal || []),
			revenuePerClass: convertDates(revenueData.revenuePerClass || []),
			revenueTotal: convertDates(revenueData.revenueTotal || []),
			reservationsByTime: reservationsByTimeData.heatmapData || []
		};
	} catch (error) {
		console.error('Error loading info page data:', error);

		// Return empty data on error
		return {
			stationDepartures: Array(6).fill(0),
			stationArrivals: Array(6).fill(0),
			reservationsPerClass: [
				{ id: 'First Class', data: [] },
				{ id: 'Business Class', data: [] },
				{ id: 'Economy Class', data: [] }
			],
			reservationsTotal: [{ id: 'Total Reservations', data: [] }],
			revenuePerClass: [
				{ id: 'First Class', data: [] },
				{ id: 'Business Class', data: [] },
				{ id: 'Economy Class', data: [] }
			],
			revenueTotal: [{ id: 'Total Revenue', data: [] }],
			reservationsByTime: Array(7).fill(0).map(() => Array(24).fill(0))
		};
	}
};
