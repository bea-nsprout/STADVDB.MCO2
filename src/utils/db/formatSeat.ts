import { getClassIndex } from '$lib/data/classTypes.ts';

function colToLetter(col: number): string {
    return String.fromCharCode(col - 1 + 65); // col: 1 to 5 --maps--> A to E
}

export function formatSeat(car: string, row: string, col: string): string{
    return `${colToLetter(parseInt(col))}${parseInt(row)}`;     // 1 - A16
}


export function formatCar(car: string, classType: string): number {
    return parseInt(car) - (2 - getClassIndex(classType))
}