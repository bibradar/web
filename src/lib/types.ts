export interface Lib {
    id: number,
    name: string,
    bib: string,
    uni: string,
    location: string,
    averages: number[],
    occupations: number[]
}

export interface LibDayPrediction {
    library_id: number,
    occupancy: number[]
}