function carsPerClass() {
	return [
		{class: "First", cars: 1},
		{class: "Business", cars: 1},
		{class: "Economy", cars: 6}
	]
}

export function getClassIndex(classType:string) {
	switch (classType) {
		case "Economy": return 0;
		case "Business": return 1;
		case "First": return 2;
		default: return 0;
	}
}