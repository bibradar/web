import type { Lib, LibDayPrediction } from '$lib/types';
import type { ServerLoad } from "@sveltejs/kit";


function getWeedayIndex() {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(new Date().toLocaleString('en-us', { weekday: 'short' }))
}

// const API_URL = "https://ml-backend-1060597826530.europe-west3.run.app";
const API_URL = "http://192.168.178.252:8000";

export const load: ServerLoad = async ({ params, fetch }) => {
    let libs: Lib[] = await fetch(API_URL + "/libraries").then(async (response) => {
        console.log(response);
        let libs: Lib[] =  await response.json();


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
            lib.averages = new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (!avgs[lib.id]) {
                        console.error("No average occupations found for library " + lib.id);
                        resolve([]);
                        return;
                    }
                    resolve(avgs[lib.id]["avg_user_count"].map(function(n, i) { return n / avgs[lib.id]["max_user_count"][i]; }).slice(8, 24))
                }, 1)
            })
            lib.occupations = new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (!day_pred[lib.id]) {
                        console.error("No average occupations found for library " + lib.id);
                        resolve([]);
                        return;
                    }

                    let lib_pred = day_pred.find((pred) => pred.library_id === lib.id);

                    if (!lib_pred) {
                        console.error("No predictions found for library " + lib.id);
                        resolve([]);
                        return;
                    }
                    resolve(lib_pred.occupancy.map(function(n, i) { return n / avgs[lib.id]["max_user_count"][i]; }).slice(8, 24))
                }, 1)
            });
        });

        return libs;
    });
    return {
        libs,
    };
}

