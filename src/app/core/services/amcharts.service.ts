/*
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
// import * as am4maps from '@amcharts/amcharts4/maps';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import am4themes_material from '@amcharts/amcharts4/themes/material';
import am4themes_dark from "@amcharts/amcharts4/themes/dark";
*/


import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AmchartsService {

    public am4core;
    public am4charts;
    public am4themes_animated;
    public am4themes_material;
    public am4themes_dark;

    constructor() {
        // Lazy loading the services, could overload constructor for selective loading
        Promise.all([
            import("@amcharts/amcharts4/core"),
            import("@amcharts/amcharts4/charts"),
            import("@amcharts/amcharts4/themes/animated"),
            import("@amcharts/amcharts4/themes/material"),
            import("@amcharts/amcharts4/themes/dark")
        ]).then((modules) => {
            this.am4core = modules[0];
            this.am4charts = modules[1];
            this.am4themes_animated = modules[2].default;
            this.am4themes_material = modules[3];// modules[3].default;
            this.am4themes_dark = modules[4]; // modules[4].default;

            // Chart code goes here
        }).catch((e) => {
            const errorMsg = 'Error while lazy loading Amcharts';
            console.error(errorMsg, e);
            throw new Error(errorMsg);
        })

    }

}
