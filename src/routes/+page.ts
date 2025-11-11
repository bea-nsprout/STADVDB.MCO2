import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Return empty trains array - will be populated when user clicks search
	return {
		trains: []
	};
};
