'use script';

/////// RAILSTATION DATA
import RAILSTATION_DATA from './railstationRemap.js';
import RAILSTATION_ADVISORIES from './railAlertRemap.js';
import { openModal } from './script.js';

///// HTML elements
const btn = document.querySelector('.destination');
const form = document.querySelector('.form');
const searchBar = document.querySelector('#search');
const modalInGeo = document.querySelector('.modal');
const div = document.createElement('div');
const infoBox = document.querySelector('.info_box');
const infoHead = document.querySelector('.info_header');

//////
function deleteChildElements(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/////// GEOLOCATION ACTIVATOR FUNCTION
const coordPromiseGetter = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

//////// USER'S COORD PROMISE FUNCTION
const userCoordLocationPromise = function () {
  return coordPromiseGetter().then(pos => {
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  });
};

///// WAIT FUNCTION
const wait = function (seconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, seconds * 1000);
  });
};

////// Function to calculate arrival time based on walking speed (feet per minute) and distance (feet)

////
function calculateDrivingArrivalTime(distanceFeet, drivingSpeedMPH) {
  // Convert feet to miles
  const distanceMiles = distanceFeet / 5280;

  // Convert miles per hour to miles per minute
  const drivingSpeedMPM = drivingSpeedMPH / 60;

  // Calculate time in minutes
  const timeMinutes = distanceMiles / drivingSpeedMPM;

  // Convert total minutes to hours and remaining minutes
  const hours = Math.floor(timeMinutes / 60);
  const minutes = Math.round(timeMinutes % 60);

  // Construct the formatted time string
  let timeString = '';
  if (hours > 0) {
    timeString += hours + ' hours, and ';
  }
  timeString += minutes + ' minutes';

  return timeString;
}

///////// Function to calculate distance between two points given their latitude and longitude
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const feetInMile = 5280; // Feet in a mile

  // Convert latitude and longitude from degrees to radians
  const toRadians = degrees => (degrees * Math.PI) / 180;
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  // Haversine formula
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMiles = R * c; // Distance in miles
  const distanceFeet = distanceMiles * feetInMile; // Distance in feet

  return distanceFeet;
}

//////// CHECKING IF A VARIABLE IS A PROMISE
function isPromise(value) {
  return value instanceof Promise;
}

//////// CHECKING IF USER IS WITHIN RADIUS
function withinRadiusCheckerFun(stationsPromOrArr, userPromise) {
  ////// WORKING WITH PROMISE
  if (isPromise(stationsPromOrArr)) {
    userPromise.then(user => {
      /////////// CHECKING DATA
      ////// USER'S DATA
      console.log("USER'S DATA:", user);

      stationsPromOrArr.then(stationData => {
        /// STATION(S) IN USER'S RADIUS
        if (stationData.length > 1) {
          console.log("STATION(S)'S DATA:", stationData);
          const multipleStations = stationData.reduce((acc, station) => {
            acc.push(station);
            return acc;
          }, []);

          const stationListItems = multipleStations
            .map(station => {
              return `<li>${station.STATIONNAME}</li>`;
            })
            .join(''); // Join the list items into a single string
          const html = `
          <p>Hi user, You are currently within the radius of ${multipleStations.length} different stations, and one of them is currently having an advisory issue. Kindly be on the lookout for updates and information.</p>
          <ul>
          ${stationListItems}
          </ul>
          `;
          div.insertAdjacentHTML('beforeend', html);
          infoBox.appendChild(div);
          return;
        }
        //// STATION IN USER'S RADIUS
        if (stationData.length === 1) {
          const [station] = stationData;
          console.log("STATION'S DATA:", station);

          ///// GETTING ADVISORY OBJ BASED ON CURR STATION
          const curStatioinAdvisoryObj = RAILSTATION_ADVISORIES.lines.find(
            advisory => {
              if (station.LINEABBREVIATION.includes(advisory.name))
                return advisory;
            }
          );

          console.log('ADVISORY DATA:', curStatioinAdvisoryObj);

          /////// GETTING THE DISTANCE FROM USER'S CURRENT LOCATION TO ADVOSIRY AREA / STATION WITH ADVISORY IN FEET
          const distance = Math.floor(
            calculateDistance(
              station.LATITUDE,
              station.LONGITUDE,
              user.latitude,
              user.longitude
            )
          );
          ///// ALERT MESSAGE
          //////
          const html = `
            <h2>ALERT in <span class="highlight">${
              station.STATIONNAME
            }</span></h2>
             <p>\n "${
               curStatioinAdvisoryObj.SERVICE_ADVISORY[2].text
             }".\nYou are currently about ${distance} feet away from the area, you should arrive there in about ${calculateDrivingArrivalTime(
            distance,
            40
          )}.</p>
           
          `;
          div.insertAdjacentHTML('beforeend', html);
          infoBox.appendChild(div);
          return;
          /////
        }
      });
    });
  }
  ////////// WORKING WITH ARRAY
  if (!isPromise(stationsPromOrArr)) {
    userPromise.then(user => {
      /////////// CHECKING DATA
      ////// USER'S DATA
      console.log("USER'S DATA:", user);

      /// STATION(S) IN USER'S RADIUS
      if (stationsPromOrArr.length > 1) {
        console.log("STATION(S)'S DATA:", stationsPromOrArr);
        const multipleStations = stationsPromOrArr.reduce((acc, station) => {
          acc.push(station);
          return acc;
        }, []);

        const div = document.createElement('div');
        const stationListItems = multipleStations
          .map(station => {
            return `<li>${station.STATIONNAME}</li>`;
          })
          .join(''); // Join the list items into a single string
        const html = `
         <p>Hi User, We have ${multipleStations.length} stations matching your searched destination. Please specify from the options listed.</p>
         <ol>
          ${stationListItems}
         </ol>
        
        `;
        div.insertAdjacentHTML('beforeend', html);
        infoBox.appendChild(div);

        return;
      }
      //// STATION IN USER'S RADIUS
      if (stationsPromOrArr.length === 1) {
        const [station] = stationsPromOrArr;
        console.log("STATION'S DATA:", station);

        ///// GETTING ADVISORY OBJ BASED ON CURR STATION
        const curStatioinAdvisoryObj = RAILSTATION_ADVISORIES.lines.find(
          advisory => {
            if (station.LINEABBREVIATION.includes(advisory.name))
              return advisory;
          }
        );

        console.log('ADVISORY DATA:', curStatioinAdvisoryObj);

        /////// GETTING THE DISTANCE FROM USER'S CURRENT LOCATION TO ADVOSIRY AREA / STATION WITH ADVISORY IN FEETs
        const distance = Math.floor(
          calculateDistance(
            station.LATITUDE,
            station.LONGITUDE,
            user.latitude,
            user.longitude
          )
        );
        ///// ALERT MESSAGE
        const html = `
         <h2>ALERT in <span class="highlight">${station.STATIONNAME}</span></h2>
             <p>\n "${
               curStatioinAdvisoryObj?.SERVICE_ADVISORY
                 ? curStatioinAdvisoryObj?.SERVICE_ADVISORY[2]?.text
                 : 'No Advisory Alert.'
             }".\nYou are currently about ${distance.toLocaleString()} feet away from the area, you should arrive there in about ${calculateDrivingArrivalTime(
          distance,
          40
        )}.</p>
    
      `;
        div.insertAdjacentHTML('beforeend', html);
        infoBox.appendChild(div);
        return;
      }
    });
  }
}

//// USER "SIGNING UP FOR NOTIS AND UPDATES"
btn.addEventListener('click', function (e) {
  if (infoHead.childNodes) {
    deleteChildElements(infoHead);
  }
  const html = `<h2 class="modal__header">
          ADVISORY
          <span class="highlight">ALERT</span>
        </h2>`;
  infoHead.insertAdjacentHTML('beforeend', html);
  // adviHead.appendChild();
  e.preventDefault();
  alert("You're now signed up for push notifications and updates.");
  //////
  ////// SEND NOTIS AFTER 5 SECONDS
  wait(5).then(() => {
    ///////
    openModal();
    /////// GETTING ALL STATIONS WITHING GIVEN RADIUS
    function getStationsWithinRadius(stationsData, userPromise, radiusTest) {
      return userPromise.then(userData => {
        const stationsWithinRadius = stationsData.filter(function (station) {
          const distance = Math.floor(
            calculateDistance(
              station.LATITUDE,
              station.LONGITUDE,
              userData.latitude,
              userData.longitude
            )
          );
          ////////// CHECKING IF USER IS IN ADVOSIRY AREA / STATION WITH ADVISORY
          if (distance <= radiusTest) return station;
        });
        return stationsWithinRadius;
      });
    }

    const stationsWithinRadiusPromise = getStationsWithinRadius(
      RAILSTATION_DATA,
      userCoordLocationPromise(),
      20000
    );
    //06/20/2024
    /////////////////stations sorted according to railline (not in use yet)
    ///// RAIL LINES
    function stationSorterIntoRailline(line) {
      return RAILSTATION_DATA.reduce(function (acc, station) {
        if (station.LINEABBREVIATION.includes(`${line}`)) acc.push(station);
        return acc;
      }, []);
    }

    const NJCL = stationSorterIntoRailline('NJCL');
    const NEC = stationSorterIntoRailline('NEC');
    const MNBN = stationSorterIntoRailline('MNBN');
    const RARV = stationSorterIntoRailline('RARV');
    const BNTN = stationSorterIntoRailline('BNTN');
    //// FIX DUPLICATE IN MNE AND MNEG
    const MNE = stationSorterIntoRailline('MNE');
    const MNEG = stationSorterIntoRailline('MNEG');
    /////
    const PASC = stationSorterIntoRailline('PASC');
    const PRIN = stationSorterIntoRailline('PRIN');
    const ATCL = stationSorterIntoRailline('ATLC');
    const SL = stationSorterIntoRailline('SL');

    ////CALLING FUNCTION
    withinRadiusCheckerFun(
      stationsWithinRadiusPromise,
      userCoordLocationPromise()
    );
  });

  if (infoBox.childNodes) {
    deleteChildElements(infoBox);
  }
  div.innerHTML = '';
});

//// ALL RAIL LINE ABBR. NAMES FROM "RAILSTATION_ADVISORIES" DATA
const allLinesAbbrNameFromAdvisoryData = RAILSTATION_ADVISORIES.lines.reduce(
  function (arr, line) {
    arr.push(line.name);

    return arr;
  },
  []
);
//console.log(allLinesAbbrNameFromAdvisoryData);

//// ALL RAIL LINE ABBR. NAMES FROM "RAILSTATION_DATA" DATA
const line = new Set(
  RAILSTATION_DATA.reduce(function (acc, station) {
    acc.push(station.LINEABBREVIATION);
    return acc;
  }, [])
);
//console.log(line);

/////// 06/25/2024
//// WORDS CAPITALIZATION
function capitalizeWords(inputString) {
  // Split the input string into an array of words
  let words = inputString.split(' ');

  // Capitalize the first letter of each word
  let capitalizedWords = words.map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  // Join the capitalized words back into a single string
  return capitalizedWords.join(' ');
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  deleteChildElements(infoHead);

  const html = `
     <h2 class="modal__header">
        Destination
        <span class="highlight">INFORMATION</span>
      </h2>
  `;

  document.querySelector('.info_header').insertAdjacentHTML('afterbegin', html);

  const searchDestinationSentence = searchBar.value;
  const searchDestination = capitalizeWords(searchDestinationSentence);
  console.log(searchDestination);
  const userStationDestination = RAILSTATION_DATA.reduce(function (
    acc,
    curStation
  ) {
    if (curStation.STATIONNAME.includes(searchDestination))
      acc.push(curStation);

    return acc;
  },
  []);

  console.log(userStationDestination);
  searchBar.value = '';
  if (searchDestinationSentence) {
    withinRadiusCheckerFun(userStationDestination, userCoordLocationPromise());
    openModal();
  }
  if (infoBox.childNodes) {
    console.log('childrens');
    deleteChildElements(infoBox);
  }
  div.innerHTML = '';
});
