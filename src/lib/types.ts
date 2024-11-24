export interface Lib {
    id: number,
    name: string,
    bib: string,
    uni: string,
    location: string,
    averages: Promise<number[]>,
    occupations: Promise<number[]>
}

export interface LibDayPrediction {
    library_id: number,
    occupancy: number[]
}