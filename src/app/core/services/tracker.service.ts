import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/core';

export interface PositionModel {
  latitude: number;
  /**
   * longitude in decimal degrees
   */
  longitude: number;
  /**
   * Accuracy level of the latitude and longitude coordinates in meters
   */
  accuracy: number;
  /**
   * Accuracy level of the altitude coordinate in meters (if available)
   */
  altitudeAccuracy?: number;
  /**
   * The altitude the user is at (if available)
   */
  altitude?: number;
  /**
   * The speed the user is traveling (if available)
   */
  speed?: number;
  /**
   * The heading the user is facing (if available)
   */
  heading?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TrackerService {

  public currentLatitude: number;
  public currentLongitude: number;

  constructor() {
  }

  async getCurrentLocation(): Promise<PositionModel> {
    try {
    const position = await Geolocation.getCurrentPosition();
    return position.coords;
    } catch (err) {
			throw new Error('Position Error');
      // throw err;
    }
  }

  /**
   * Calculates distance from point A to point B
   * returns distance in meters
   */
  async calcDistance(startLat: number, startLong: number, endLat: number, endLong: number): Promise<number> {
    try {
      const R = 6371e3; // Earth radius in meters
      const φ1 = startLat * Math.PI/180; // convert lat1 from degrees to radian
      const φ2 = endLat * Math.PI/180;// convert lat2 from degrees to radian
      const Δφ = (endLat-startLat) * Math.PI/180; //  φ2 - φ1 in radian
      const Δλ = (endLong-startLong) * Math.PI/180; // convert (lon2-lon1) from degrees to radian
  
      // a = sin²(c/2) the haversine formula
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2); 
      
      // in lieu of  'const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));' we use
      const c= 2* Math.asin(Math.sqrt(a) ) ; 
  
      // Distance = Earth radius  x  Central angle(rad)
      const dist = R * c; // in meters 
      //const dist = parseFloat(p1.distanceTo(p2).toPrecision(4));

      return dist;
    } catch (err) {
      throw err;
    }
  }

  // 1) Track coordinates

  // 2) If Coordinates are very close to the previous ones (say 30% of block distance), then don't update

  // 3) Otherwise, update

  // 4) If user manually refreshes, refresh but only if his distance isn't very close from previous distance, and the 2 ones before

  /** Data Tracked
   * Must keep a log of places people have visited in an efficient way, for the last 3 months (data expiry data from the start on dynamodb see trello)
   * (1) To check if people are abusing the service, need to flag people who visit places that are repeatedly very far away from each other
   * After verification of flagged users, ban them. Or ban them from the start, or rate limit them. But they can simply do it by going place from place. But if they visit too many places, too fast, then there's a problem. 
   * So (2) need to check distance parcourue or number of requests (given the front-end won't ask requests if not necessary)
   */
}
