export interface CovidDataModel {
    county: {
        countyId: string | number;
        lastDate: string | Date;
        confirmed: number[];
        death: number[];
        letalityRate: number;
        pop_per_bed: number;
        covidScore: number;
    };
    state: {
        stateId: string | number;
        deathLastDay: number;
        death: number[];
        confirmedLastDay: number;
        confirmed: number[];
        stateName: string;
        stateAbr: string;
        stateLat: number;
        stateLon: number;
    };
    states: covidStateData[];
};

export interface covidStateData {
           confirmed:number;
           death:number;
           stateId:string;
           stateAbr:string;
           stateName:string;
           stateLat:number;
           stateLon:number;
};