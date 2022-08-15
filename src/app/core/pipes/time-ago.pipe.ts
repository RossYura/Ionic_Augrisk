import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let timeValue = (typeof value === "string") ? parseInt(value) : value ;
    timeValue = (timeValue.toString().length < 13) ? timeValue * 1000 : timeValue;
    const convertValueToDate = new Date(timeValue) ;
    return this.timeDifference( convertValueToDate );
  }

  timeDifference(valueDate: Date) {

    const current = new Date();
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;
    const elapsed = current.getTime() - valueDate.getTime();

    if (elapsed < msPerMinute) {
      return Math.round(elapsed / 1000) + ' seconds ago';
    } else if (elapsed < msPerHour) {
      return Math.round(elapsed / msPerMinute) + ' minutes ago';
    } else if (elapsed < msPerDay) {
      return Math.round(elapsed / msPerHour) + ' hours ago';
    } else if (elapsed < msPerMonth) {
      return Math.round(elapsed / msPerDay) + ' days ago';
    } else if (elapsed < msPerYear) {
      // return 'approx ' + Math.round(elapsed / msPerMonth) + ' months ago';
      return Math.round(elapsed / msPerMonth) + ' months ago';
    } else {
      // return 'approx ' + Math.round(elapsed / msPerYear) + ' years ago';
      return Math.round(elapsed / msPerYear) + ' years ago';
    }
  }

}
