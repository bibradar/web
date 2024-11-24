import type { Lib, LibDayPrediction } from '$lib/types';
import type { ServerLoad } from "@sveltejs/kit";


function getWeedayIndex() {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(new Date().toLocaleString('en-us', { weekday: 'short' }))
}

const API_URL = "https://bibradar-ml.dorian.im";
//const API_URL = "http://192.168.178.252:8000";

export const load: ServerLoad = async ({ params, fetch }) => {
    let libs: Lib[] = await fetch(API_URL + "/libraries").then(async (response) => {
        console.log(response);
        let libs: Lib[] =  (await response.json()).sort((a, b) => a.id - b.id);


        let avgs: void | any[] = await fetch(API_URL + "/user_count_stats/" + getWeedayIndex() ).then(async (response) => {
            return await response.json()
        });

        let day_pred: void | LibDayPrediction[] = await fetch(API_URL + "/libraries_day_prediction").then(async (response) => {
            return await response.json()
        });

        if (!avgs) {
            console.error("No average occupations found");
            return libs;
        }

        if (!day_pred) {
            console.error("No day predictions found");
            return libs;
        }

        libs.forEach((lib) => {
                    if (!avgs[lib.id]) {
                        console.error("No average occupations found for library " + lib.id);
                        lib.averages = [];
                    } else {
                    let max_max_user_count = Math.max(...avgs[lib.id]["max_user_count"]);
                    lib.averages = avgs[lib.id]["avg_user_count"].map(function(n, i) { return n / max_max_user_count; }).slice(8, 24)
                    }
            
                    if (!day_pred[lib.id]) {
                        console.error("No average occupations found for library " + lib.id);
                        lib.occupations = [];
                    }else {

                    let lib_pred = day_pred.find((pred) => pred.library_id === lib.id);

                    if (!lib_pred) {
                        console.error("No predictions found for library " + lib.id);
                        lib.occupations = [];
                    } else {
                    let max_max_user_count = Math.max(...avgs[lib.id]["max_user_count"]);
                    lib.occupations = lib_pred.occupancy.map(function(n, i) { return n / max_max_user_count; }).slice(8, 24);
                    }
                }
            
        });

        return libs.filter((lib) => lib.averages.length > 0 && lib.occupations.length > 0);
    });
    return {
        libs,
    };
}

