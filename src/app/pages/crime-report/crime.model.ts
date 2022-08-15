
export interface RiskDataModel { 
    countyId: string;
    blockId: string;
    econScore: string;
    stormScore: string;
    econData: string; // array
    stormData: string; // array
    volData: string; // array
    globalSocScore: string;
    coastalFloodScore: string;
    volScore: string;
    nuclearScore: string;
    nuclearData: string;
    airQualScore: string;
    airQualData: string;
    wildfireData: string; // array
    earthScore: string;
    globalScore: string;
    globalEnvScore: string;
    healthScore: string;
    coastalFloodData: string; // array
    earthData: string;
    healthData: string;
    wildfireScore: string;
    crimeScore: any;
    crimeData: string;
    free?: boolean;
    freeSocRisk?: string;
    freeEnvRisk?: string;
    freeSocRisksNum?: number;
    freeEnvRisksNum?: number;
}