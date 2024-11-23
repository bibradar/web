import type { ServerLoad } from "@sveltejs/kit";

interface Lib {
    id: number,
    name: string,
    bib: string,
    uni: string,
    location: string,
    occupations: Promise<number[]>
}

export const load: ServerLoad = async ({ params, fetch }) => {
    let libs: Lib[] = await fetch("https://ml-backend-1060597826530.europe-west3.run.app/libraries").then(async (response) => {
        console.log(response);
        let libs: Lib[] =  await response.json();

        libs.forEach((lib) => {
        lib.occupations = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve([0.0, 0.1, 0.2, 0.4, 0.8, 1.0, 0.6, 0.3, 0.1, 0.0])
            }, 1000)
        });
    });
        return libs
    })

    return {
        libs
    };
}

