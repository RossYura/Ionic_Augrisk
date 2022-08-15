// Angular
import { Component, OnDestroy, AfterViewInit, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
// Services

// Models
import { UserModel } from '../../../core/models/user.model';
import { environment } from '../../../../environments/environment';
import { AmchartsService } from '../../../core/services/amcharts.service';
import { UserService } from 'src/app/core/services/user.service';


// If more than one component use the map create a shared lazy loaded service
// These modules are all lazy loaded cause only necessary here
import * as am4maps from '@amcharts/amcharts4/maps';
import am4geodata_usaLow from '@amcharts/amcharts4-geodata/usaLow';
import am4themes_moonrisekingdom from '@amcharts/amcharts4/themes/moonrisekingdom';
import { CovidService } from '../covid.service';
import { Location } from '@angular/common';

@Component({
  selector: 'covid',
  templateUrl: './covid.component.html',
  styleUrls: ['./covid.component.scss'],
})
export class CovidComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscription: Subscription;
  public userData: UserModel;
  public currentProjectId: string;
  public currentProjectAddress: string;
  public loadingData$ = new BehaviorSubject<boolean>(true);
  public riskData$ = new BehaviorSubject<boolean>(null);

  // Project data
  public countyId: any;
  public countyName: string;
  public stateName: string;
  public lastUpdateDate: string | Date;

  // Initializing summary blocs variables
  public riskScore$ = new BehaviorSubject<number>(0);
  public referencesData$: BehaviorSubject<string> = new BehaviorSubject(null);
  public methodologyData$: BehaviorSubject<string> = new BehaviorSubject(null);

  // Theme Colors
  public bgColor: string = '#FEFEFE';
  public textcolor: string = '#666666';

  // Amchart map
  public chart: any;
  public chartCovidCountyStateUsa: any;
  public chartConfirmedCasesCountyAndState: any;
  public dataCovid19InfosByCountyId: any;
  // Choose the name of the variable to display : death, confirmed
  public nameOfColumnUsed = "confirmed";
  //config of array content
  public configArrayNames = {
    state: "stateAbr",
    latitude: "stateLat",
    longitude: "stateLon",
    city: "stateName",
    count: this.nameOfColumnUsed
  }
  public dataMap = [];
  public usaConfirmedCases = 0;
  public usaDeathCases = 0;
  public regionalSeries: any = {};
  public currentSeries: any = {};
  public xAxis: any;
  zoomOut: any;
  polygonSeries: any;
  innerWidth = 0;
  constructor(private userService: UserService, private amcharts: AmchartsService,
    private router: Router, private covidService: CovidService, private zone: NgZone, private _location: Location) {
    this.loadingData$.next(true);
    // MUST USE GEOCODING API, WITH RATE LIMITER AND CACHED REQUESTS
    this.countyName = "Chilton County";
    this.countyId = '01021';
    this.stateName = "Alabama";

    const darkMode = this.userService.getUserPreferences().darkMode;
    if (darkMode) {
      console.log('Dark mode XX', darkMode);
      this.textcolor = '#ffffff';
    }
  }

  ngOnInit() {
    /** Might not be required */
    this.innerWidth = window.innerWidth;
  }

  ngAfterViewInit(): void {

    // 1) County already manually defined for the time being
    /** Must add geocoding here */

    // 2) Get Covid Data 
    this.covidService.getCovid19InfosByCountyId(this.countyId).subscribe((res) => {
      if (!res.county) {
        this.riskData$.next(false);
        this.loadingData$.next(false);
        return;
      }
      if (!environment.production) console.log('Covid19 Data: ', res);
      this.dataCovid19InfosByCountyId = res;
      this.lastUpdateDate = res.county.lastDate;
      this.dataMap = res.states;
      this.riskScore$.next((typeof res.county.covidScore === 'string') ? Number(res.county.covidScore) : res.county.covidScore || 0);
      this.zone.runOutsideAngular(() => {
        this.am4coreOperations();
        this.codivCountyStateUsa();
        this.confirmedCasesCountyAndState();
      })
      this.referencesData$.next(`County cases and deaths : <a target="_blank" href="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/">USA facts</a>.<br>
				Number of hospital beds : <a target="_blank" href="https://coronavirus-resources.esri.com/datasets/definitivehc::definitive-healthcare-usa-hospital-beds?geometry=80.507%2C-16.820%2C-105.469%2C72.123"> Definitive Healthcare data</a>.<br>
            <br>Data was last updated on ${this.lastUpdateDate} `);

      this.methodologyData$.next(`The Covid-19 score was computed based on three indicators in your county:<br>- The number of new cases in the last 10 days per 100k inhabitants.<br>- The average number of deaths for 100 confirmed cases since the beginning of the Covid-19 pandemic.<br>- The number of available hospital beds in comparison to your county's population.`);

      this.riskData$.next(true);
      this.loadingData$.next(false);

    }, (err) => {
      this.loadingData$.next(false);
      throw err;
    });

  }

  // ------ CasesCountyAndState Code Start -------
  confirmedCasesCountyAndState() {
    const state_cases = [];
    const county_cases = [];
    const startDate = new Date(this.dataCovid19InfosByCountyId['county'].lastDate);
    let culDate;
    let sommeCountyConfirmedCases = 0;
    for (let i = 0; i < this.dataCovid19InfosByCountyId['state'].confirmed.length; i++) {
      culDate = new Date();
      culDate.setDate(startDate.getDate() - (10 - (i + 1)));
      state_cases.push({
        'date': culDate,
        'value': (this.dataCovid19InfosByCountyId['state'].confirmed[i] - this.dataCovid19InfosByCountyId['state'].confirmed[0] < 0)
          ? 0
          : this.dataCovid19InfosByCountyId['state'].confirmed[i] - this.dataCovid19InfosByCountyId['state'].confirmed[0]
      });
      sommeCountyConfirmedCases +=
        (this.dataCovid19InfosByCountyId['state'].confirmed[i] - this.dataCovid19InfosByCountyId['state'].confirmed[0] < 0)
          ? 0
          : this.dataCovid19InfosByCountyId['state'].confirmed[i] - this.dataCovid19InfosByCountyId['state'].confirmed[0];
      county_cases.push({
        'date': culDate,
        'value': (this.dataCovid19InfosByCountyId['county'].confirmed[i] - this.dataCovid19InfosByCountyId['county'].confirmed[0] < 0)
          ? 0
          : this.dataCovid19InfosByCountyId['county'].confirmed[i] - this.dataCovid19InfosByCountyId['county'].confirmed[0]
      });
    }

    // this.amcharts.am4core.useTheme(am4themes_moonrisekingdom);
    this.amcharts.am4core.useTheme(this.amcharts.am4themes_animated);

    let val_county = { max: 0, min: 10000000 }
    let val_state = { max: 0, min: 100000000 }

    for (let i = 0; i < county_cases.length; i++) {
      if (county_cases[i].value < val_county.min) {
        val_county.min = county_cases[i].value;
      }
      if (county_cases[i].value > val_county.max) {
        val_county.max = county_cases[i].value;
      }
      if (state_cases[i].value < val_state.min) {
        val_state.min = state_cases[i].value;
      }
      if (state_cases[i].value > val_state.max) {
        val_state.max = state_cases[i].value;
      }
    }
    let min_break = this.dataCovid19InfosByCountyId['state'].confirmedLastDay / 10;
    let max_break = sommeCountyConfirmedCases / 10;

    // Create chart instance

    this.chartConfirmedCasesCountyAndState = this.amcharts.am4core.create("confirmedCasesCountyAndState", this.amcharts.am4charts.XYChart);

    // Create axes
    const dateAxis = this.chartConfirmedCasesCountyAndState.xAxes.push(new this.amcharts.am4charts.DateAxis());
    const valueAxis = this.chartConfirmedCasesCountyAndState.yAxes.push(new this.amcharts.am4charts.ValueAxis());
    valueAxis.min = 0;
    valueAxis.max = val_state.max + 5;
    valueAxis.strictMinMax = true;
    valueAxis.renderer.minGridDistance = 30;

    // Create value axis break
    const axisBreak = valueAxis.axisBreaks.create();
    axisBreak.startValue = min_break;
    axisBreak.endValue = max_break;
    // fixed axis break
    const d = (axisBreak.endValue - axisBreak.startValue) / (valueAxis.max - valueAxis.min);
    axisBreak.breakSize = 0.05 * (1 - d) / d; // 0.05 means that the break will take 5% of the total value axis height
    const hoverState = axisBreak.states.create("hover");
    hoverState.properties.breakSize = 2;
    hoverState.properties.opacity = 0.1;
    hoverState.transitionDuration = 1500;
    axisBreak.defaultState.transitionDuration = 1000;

    // Text Colors
    // this.chartConfirmedCasesCountyAndState.legend.labels.template.fill = this.amcharts.am4core.color(this.textcolor);
    dateAxis.renderer.labels.template.fill = this.amcharts.am4core.color(this.textcolor);
    valueAxis.renderer.labels.template.fill = this.amcharts.am4core.color(this.textcolor);

    this.createSeriesForConfirmedCasesCountyAndState("value" + "county_cases", "County cases ", county_cases);
    this.createSeriesForConfirmedCasesCountyAndState("value" + "state_cases", "State cases ", state_cases);

		/**
	   * ========================================================
	   * Enabling responsive features
	   * ========================================================
	   */

    this.chartConfirmedCasesCountyAndState.responsive.enabled = false;
    this.chartConfirmedCasesCountyAndState.responsive.rules.push({
      relevant: function (target) {
        if (target.pixelWidth <= 400) {
          return true;
        }
        return false;
      },
      state: function (target, stateId) {
        return;
      }
    });
    this.chartConfirmedCasesCountyAndState.legend = new this.amcharts.am4charts.Legend();
    if (this.innerWidth <= 600) {
      this.chartConfirmedCasesCountyAndState.legend.position = "bottom";
    } else {
      this.chartConfirmedCasesCountyAndState.legend.position = "right";
    }
    this.chartConfirmedCasesCountyAndState.legend.scrollable = true;
    this.chartConfirmedCasesCountyAndState.legend.itemContainers.template.events.on("over", (event) => {
      this.processOver(event.target.dataItem.dataContext);
    })

    this.chartConfirmedCasesCountyAndState.legend.itemContainers.template.events.on("out", (event) => {
      this.processOut(event.target.dataItem.dataContext);
    });
  }

  createSeriesForConfirmedCasesCountyAndState(s, name, items) {
    const series = this.chartConfirmedCasesCountyAndState.series.push(new this.amcharts.am4charts.LineSeries());
    series.dataFields.valueY = "value" + s;
    series.dataFields.dateX = "date";
    let col = "#e60000";
    if (s == "valuecounty_cases") col = "#00ff7c";
    series.stroke = this.amcharts.am4core.color(col);
    series.name = name;

    const segment = series.segments.template;
    segment.interactionsEnabled = true;

    const hoverState = segment.states.create("hover");
    hoverState.properties.strokeWidth = 3;

    const dimmed = segment.states.create("dimmed");

    segment.events.on("over", (event) => {
      this.processOver(event.target.parent.parent.parent);
    });

    segment.events.on("out", (event) => {
      this.processOut(event.target.parent.parent.parent);
    });

    const data = [];
    items.forEach(element => {
      let dataItem = { date: new Date(element.date) };
      dataItem["value" + s] = element.value;
      data.push(dataItem);
    });

    series.data = data;
    return series;
  }

  processOver(hoveredSeries) {
    hoveredSeries.toFront();

    hoveredSeries.segments.each((segment) => {
      segment.setState("hover");
    })

    this.chartConfirmedCasesCountyAndState.series.each((series) => {
      if (series != hoveredSeries) {
        series['segments'].each((segment) => {
          segment.setState("dimmed");
        })
        series.bulletsContainer.setState("dimmed");
      }
    });
  }

  processOut(hoveredSeries) {
    this.chartConfirmedCasesCountyAndState.series.each((series) => {
      series['segments'].each((segment) => {
        segment.setState("default");
      })
      series.bulletsContainer.setState("default");
    });
  }
  // ******* End Code CasesCountyAndState ********
  // ------ CountyStateUsa Code Start -------
  codivCountyStateUsa() {
    try {
      this.amcharts.am4core.useTheme(am4themes_moonrisekingdom);
      this.amcharts.am4core.useTheme(this.amcharts.am4themes_animated);
      let max = 0;
      this.dataMap.forEach(element => {
        this.usaConfirmedCases = this.usaConfirmedCases + element.confirmed;
        this.usaDeathCases = this.usaDeathCases + element.death;
      });
      const dataItems = [
        {
          category: 'County',
          first: this.dataCovid19InfosByCountyId['county'].lastDeath,
          second: this.dataCovid19InfosByCountyId['county'].lastConfirmed
        },
        {
          category: 'State',
          first: this.dataCovid19InfosByCountyId['state'].deathLastDay,
          second: this.dataCovid19InfosByCountyId['state'].confirmedLastDay
        },
        {
          category: 'USA',
          first: this.usaDeathCases,
          second: this.usaConfirmedCases
        }
      ];
      dataItems.forEach(element => {
        if (element.second > max) {
          max = element.second;
        }
      });
      this.chartCovidCountyStateUsa = this.amcharts.am4core.create('covidCountyStateUsa', this.amcharts.am4charts.XYChart)
      this.chartCovidCountyStateUsa.colors.step = 4;

      this.chartCovidCountyStateUsa.legend = new this.amcharts.am4charts.Legend();
      this.chartCovidCountyStateUsa.legend.position = 'top'
      this.chartCovidCountyStateUsa.legend.paddingBottom = 20
      this.chartCovidCountyStateUsa.legend.labels.template.maxWidth = 95
      this.chartCovidCountyStateUsa.legend.labels.template.fill = this.amcharts.am4core.color(this.textcolor);
      this.chartCovidCountyStateUsa.legend.valueLabels.template.fill = this.amcharts.am4core.color(this.textcolor);



      this.xAxis = this.chartCovidCountyStateUsa.xAxes.push(new this.amcharts.am4charts.CategoryAxis())
      this.xAxis.renderer.minGridDistance = 20;
      this.xAxis.dataFields.category = 'category'
      this.xAxis.renderer.cellStartLocation = 0.1
      this.xAxis.renderer.cellEndLocation = 0.9
      this.xAxis.renderer.grid.template.location = 0;
      this.xAxis.renderer.labels.template.fill = this.amcharts.am4core.color(this.textcolor);

      const yAxis = this.chartCovidCountyStateUsa.yAxes.push(new this.amcharts.am4charts.ValueAxis());
      yAxis.min = 0;
      yAxis.max = max + 5;
      yAxis.strictMinMax = true;
      yAxis.renderer.minGridDistance = 30;
      yAxis.renderer.labels.template.fill = this.amcharts.am4core.color(this.textcolor);

      // Create value axis break
      const axisBreak = yAxis.axisBreaks.create();
      axisBreak.startValue = 100;
      axisBreak.endValue = max - 100;
      // axisBreak.breakSize = 0.2;
      // fixed axis break
      const d = (axisBreak.endValue - axisBreak.startValue) / (yAxis.max - yAxis.min);
      axisBreak.breakSize = 0.05 * (1 - d) / d; // 0.05 means that the break will take 5% of the total value axis height
      const hoverState = axisBreak.states.create("hover");
      hoverState.properties.breakSize = 2;
      hoverState.properties.opacity = 0.1;
      hoverState.transitionDuration = 1500;
      axisBreak.defaultState.transitionDuration = 1000;

      this.chartCovidCountyStateUsa.data = dataItems;
      this.createSeriesForCovidCountyStateUsa('first', 'Deaths');
      this.createSeriesForCovidCountyStateUsa('second', 'Confirmed');
      //createSeries('third', 'Recovered');
    }
    catch (err) {
      console.log("err ==>", err);
    }

  }

  createSeriesForCovidCountyStateUsa(value, name) {
    const arrangeColumnsForCovidCountyStateUsa = () => {
      const series = this.chartCovidCountyStateUsa.series.getIndex(0);
      const w = 1 - this.xAxis.renderer.cellStartLocation - (1 - this.xAxis.renderer.cellEndLocation);
      if (series.dataItems.length > 1) {
        const x0 = this.xAxis.getX(series.dataItems.getIndex(0), "categoryX");
        const x1 = this.xAxis.getX(series.dataItems.getIndex(1), "categoryX");
        const delta = ((x1 - x0) / this.chartCovidCountyStateUsa.series.length) * w;
        if (this.amcharts.am4core.isNumber(delta)) {
          const middle = this.chartCovidCountyStateUsa.series.length / 2;

          let newIndex = 0;
          this.chartCovidCountyStateUsa.series.each((series) => {
            if (!series.isHidden && !series.isHiding) {
              series.dummyData = newIndex;
              newIndex++;
            }
            else {
              series.dummyData = this.chartCovidCountyStateUsa.series.indexOf(series);
            }
          })
          const visibleCount = newIndex;
          const newMiddle = visibleCount / 2;

          this.chartCovidCountyStateUsa.series.each((series) => {
            let trueIndex = this.chartCovidCountyStateUsa.series.indexOf(series);
            let newIndex = series.dummyData;

            const dx = (newIndex - trueIndex + middle - newMiddle) * delta

            series.animate({ property: "dx", to: dx }, series.interpolationDuration, series.interpolationEasing);
            series.bulletsContainer.animate({ property: "dx", to: dx }, series.interpolationDuration, series.interpolationEasing);
          })
        }
      }
    }
    const series = this.chartCovidCountyStateUsa.series.push(new this.amcharts.am4charts.ColumnSeries());
    series.dataFields.valueY = value;
    series.dataFields.categoryX = 'category';
    series.name = name;
    series.events.on("hidden", arrangeColumnsForCovidCountyStateUsa);
    series.events.on("shown", arrangeColumnsForCovidCountyStateUsa);
    series.columns.template.tooltipText = "[bold][/]\n[font-size:14px]{valueY}";
    

    const bullet = series.bullets.push(new this.amcharts.am4charts.LabelBullet())
    bullet.interactionsEnabled = false
    bullet.dy = 30;
    bullet.label.text = '{valueY}';
    bullet.label.fill = this.amcharts.am4core.color(this.textcolor);

    return series;
  }

  // ******* End Code CountyStateUsa ********
  // ------ CodivMap Code Start -------

  am4coreOperations() {
    this.regionalSeries = {};
    // Themes begin
    this.amcharts.am4core.useTheme(this.amcharts.am4themes_animated);
    // Themes end

    // Create map instance
    this.chart = this.amcharts.am4core.create("chartdiv", am4maps.MapChart);

    this.chart.homeZoomLevel = 2;
    this.chart.maxZoomLevel = 64;

    // Set map definition
    this.chart.geodata = am4geodata_usaLow;

    // Set projection
    this.chart.projection = new am4maps.projections.AlbersUsa();

    // Add button
    this.zoomOut = this.chart.tooltipContainer.createChild(this.amcharts.am4core.ZoomOutButton);
    this.zoomOut.align = "right";
    this.zoomOut.valign = "top";
    this.zoomOut.margin(20, 20, 20, 20);
    this.zoomOut.events.on("hit", () => {
      if (this.currentSeries) {
        this.currentSeries.hide();
      }
      this.chart.goHome();
      this.zoomOut.hide();
      this.currentSeries = this.regionalSeries.US.series;
      this.currentSeries.show();
    });
    this.zoomOut.hide();


    // Create map polygon series
    this.polygonSeries = this.chart.series.push(new am4maps.MapPolygonSeries());
    this.polygonSeries.useGeodata = true;
    this.polygonSeries.calculateVisualCenter = true;

    // Configure series
    let polygonTemplate = this.polygonSeries.mapPolygons.template;
    polygonTemplate.tooltipText = "{name}";
    polygonTemplate.fill = this.amcharts.am4core.color("#67b7dc");
    const createSeries = (heatfield) => {

      const polygonTemplate = this.polygonSeries.mapPolygons.template;
      polygonTemplate.tooltipText = "{name}";
      polygonTemplate.fill = this.chart.colors.getIndex(0);

      const series = this.chart.series.push(new am4maps.MapImageSeries());
      series.dataFields.value = heatfield;

      const template = series.mapImages.template;
      template.verticalCenter = "middle";
      template.horizontalCenter = "middle";
      template.propertyFields.latitude = "lat";
      template.propertyFields.longitude = "long";
      //template.tooltipText = "{name}:\n[bold]{stores} "+nameOfColumnUsed+"[/]";

      if (this.nameOfColumnUsed == 'death') {
        template.tooltipText = "Deaths in {name}: [bold]{stores} ";
      }
      if (this.nameOfColumnUsed == 'confirmed') {
        template.tooltipText = "Confirmed cases in {name}: [bold]{stores} ";
      }


      //template.tooltipText = "{name}:\n[bold]{stores} "+nameOfColumnUsed+"[/]";

      const circle: any = template.createChild(this.amcharts.am4core.Circle);
      circle.radius = 10;
      circle.fillOpacity = 0.7;
      circle.verticalCenter = "middle";
      circle.horizontalCenter = "middle";
      circle.nonScaling = true;

      const label: any = template.createChild(this.amcharts.am4core.Label);
      label.text = "{stores}";
      label.fill = this.amcharts.am4core.color("#fff");
      label.verticalCenter = "middle";
      label.horizontalCenter = "middle";
      label.nonScaling = true;

      const heat = series.heatRules.push({
        target: circle,
        property: "radius",
        min: 10,
        max: 30
      });

      // Set up drill-down
      series.mapImages.template.events.on("hit", (ev) => {

        // Determine what we've clicked on
        const data: any = ev.target.dataItem.dataContext;

        // No id? Individual store - nothing to drill down to further
        if (!data.target) {
          return;
        }

        // Create actual series if it hasn't been yet created
        if (!this.regionalSeries[data.target].series) {
          this.regionalSeries[data.target].series = createSeries("count");
          this.regionalSeries[data.target].series.data = data.markerData;
        }

        // Hide current series
        if (this.currentSeries) {
          this.currentSeries.hide();
        }

        // Control zoom
        if (data.type == "state") {
          const statePolygon = this.polygonSeries.getPolygonById("US-" + data.state);
          this.chart.zoomToMapObject(statePolygon);
        }
        else if (data.type == "city") {
          this.chart.zoomToGeoPoint({
            latitude: data.lat,
            longitude: data.long
          }, 64, true);
        }
        this.zoomOut.show();

        // Show new targert series
        this.currentSeries = this.regionalSeries[data.target].series;
        this.currentSeries.show();
      });

      return series;
    }
    const setupStores = (data) => {
      // Init country-level series
      this.regionalSeries.US = {
        markerData: [],
        series: createSeries("stores")
      };
      // Set current series
      this.currentSeries = this.regionalSeries.US.series;
      // Process data
      this.amcharts.am4core.array.each(data, (store) => {
        // Get store data
        store = {
          state: store[this.configArrayNames.state],
          long: this.amcharts.am4core.type.toNumber(store[this.configArrayNames.longitude]),
          lat: this.amcharts.am4core.type.toNumber(store[this.configArrayNames.latitude]),
          location: store[this.configArrayNames[this.configArrayNames.city]],
          city: store[this.configArrayNames.city],
          count: this.amcharts.am4core.type.toNumber(store[this.configArrayNames.count])
        };

        // Process state-level data
        if (this.regionalSeries[store['state']] == undefined) {
          const statePolygon = this.polygonSeries.getPolygonById("US-" + store['state']);
          if (statePolygon) {
            // Add state data
            this.regionalSeries[store['state']] = {
              target: store['state'],
              type: "state",
              name: statePolygon.dataItem.dataContext.name,
              count: store['count'],
              stores: store['count'],
              lat: statePolygon.visualLatitude,
              long: statePolygon.visualLongitude,
              state: store['state'],
              markerData: []
            };
            this.regionalSeries.US.markerData.push(this.regionalSeries[store['state']]);

          }
          else {
            // State not found
            return;
          }
        }
        else {
          this.regionalSeries[store['state']].stores++;
          this.regionalSeries[store['state']].count += store['count'];
        }

        // Process city-level data
        if (this.regionalSeries[store['city']] == undefined) {
          this.regionalSeries[store['city']] = {
            target: store['city'],
            type: "city",
            name: store['city'],
            count: store['count'],
            stores: store['count'],
            lat: store['lat'],
            long: store['long'],
            state: store['state'],
            markerData: []
          };
          this.regionalSeries[store['state']].markerData.push(this.regionalSeries[store['city']]);
        }
        else {
          this.regionalSeries[store['city']].stores++;
          this.regionalSeries[store['city']].count += store['count'];
        }

        // Process individual store
        this.regionalSeries[store['city']].markerData.push({
          name: store['location'],
          count: store['count'],
          stores: store['count'],
          lat: store['lat'],
          long: store['long'],
          state: store['state']
        });

      });
      this.regionalSeries.US.series.data = this.regionalSeries.US.markerData;
    }
    const loadStores = () => {
      setupStores(this.dataMap);
    }
    this.chart.events.on("ready", loadStores);
    return
  }

  changeDisplay(type) {
    this.nameOfColumnUsed = type;
    this.configArrayNames.count = this.nameOfColumnUsed;
    this.zone.runOutsideAngular(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
    this.am4coreOperations();
  }

  // ******* End Code CodivMap ********

  // ** Misc helper functions ** //
  public returnRiskScoreColor(score: number | string): 'danger' | 'warning' | 'success' | 'info' | 'primary' {
    if (typeof score === 'string') score = Number(score);

    if (score < 20) return 'success';
    else if (score < 40) return 'info';
    else if (score < 60) return 'warning';
    else return 'danger';
  }

  goBack() {
    this._location.back();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.zone.runOutsideAngular(() => {
      if (this.chartConfirmedCasesCountyAndState) {
        this.chartConfirmedCasesCountyAndState.dispose();
      }
      if (this.chartCovidCountyStateUsa) {
        this.chartCovidCountyStateUsa.dispose();
      }
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }

}
