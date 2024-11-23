export interface Lib {
    id: number,
    name: string,
    bib: string,
    uni: string,
    location: string,
    occupations: Promise<number[]>
}