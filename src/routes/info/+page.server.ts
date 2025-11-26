import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Test heatmap data (0-100 scale for each station)
	// Stations: Tokyo, Shin-Yokohama, Toyohashi, Nagoya, Kyoto, Shin-Osaka
	const stationDepartures = [85, 65, 45, 90, 70, 55];
	const stationArrivals = [10, 15, 20, 25, 18, 12];

	// Test data for reservations by class over time
	const generateDateData = (startValue: number, variance: number, count: number = 12) => {
		const data = [];
		const now = new Date();
		for (let i = 0; i < count; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
			const value = startValue + Math.floor(Math.random() * variance);
			data.push({ date, reservations: value });
		}
		return data;
	};

	const reservationsPerClass = [
		{
			id: 'First Class',
			data: generateDateData(20, 15)
		},
		{
			id: 'Business Class',
			data: generateDateData(50, 25)
		},
		{
			id: 'Economy Class',
			data: generateDateData(150, 50)
		}
	];

	// Calculate total reservations
	const reservationsTotal = [{
		id: 'Total Reservations',
		data: reservationsPerClass[0].data.map((_, i) => ({
			date: reservationsPerClass[0].data[i].date,
			reservations: reservationsPerClass.reduce((sum, cls) => sum + cls.data[i].reservations, 0)
		}))
	}];

	// Test data for revenue by class over time (in thousands)
	const generateRevenueData = (startValue: number, variance: number, count: number = 12) => {
		const data = [];
		const now = new Date();
		for (let i = 0; i < count; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
			const value = startValue + Math.floor(Math.random() * variance);
			data.push({ date, revenue: value });
		}
		return data;
	};

	const revenuePerClass = [
		{
			id: 'First Class',
			data: generateRevenueData(80, 30)
		},
		{
			id: 'Business Class',
			data: generateRevenueData(120, 40)
		},
		{
			id: 'Economy Class',
			data: generateRevenueData(200, 60)
		}
	];

	// Calculate total revenue
	const revenueTotal = [{
		id: 'Total Revenue',
		data: revenuePerClass[0].data.map((_, i) => ({
			date: revenuePerClass[0].data[i].date,
			revenue: revenuePerClass.reduce((sum, cls) => sum + cls.data[i].revenue, 0)
		}))
	}];

	return {
		stationDepartures,
		stationArrivals,
		reservationsPerClass,
		reservationsTotal,
		revenuePerClass,
		revenueTotal
	};
};
