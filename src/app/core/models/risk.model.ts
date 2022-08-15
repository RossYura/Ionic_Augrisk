export interface RiskModel {
        countyId: number | string,
        crimeRisk: boolean,
        crimeData: any;
        crimeScore: string;
        earthquakeRisk: boolean,
        stormRisk: boolean,
        stormHigherRisk?: 'Tornadoes' | 'Hurricanes' | 'Hail Storms' | 'Blizzards' | 'Snow Storms',
        coastalFloodRisk : boolean,
        nuclearRisk : boolean, 
        wildfireRisk: boolean,
        airPollutionRisk: boolean
}