function colToLetter(col: number): string {
    return col - 1 + 'A'; // col: 1 to 5 --maps--> A to E
}

export function formatSeat(car: number, row: number, col: number): string{
    return `${car} - ${colToLetter(col)}${row}`;     // 1 - A16
}