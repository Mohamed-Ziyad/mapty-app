'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;

class App {
  //construtor loads asap  when the page loads
  constructor() {
    this._map;
    this._mapEvent;
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
  }

  _getPosition() {
    //browser API geolocation-api
    if (navigator.geolocation)
      //gard for checking the existance of navigator in browsers
      navigator.geolocation.getCurrentPosition(
        this._loadMaps.bind(this), //gives a new function
        function () {
          console.log('Could not get position');
        }
      );
  }

  _loadMaps(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this._map = L.map('map').setView(coords, 13);

    //map are made out tiles picture of lands maps
    //if the custom script at last in the head all the api scripts varible are accessable by custom script
    //but api script can't access the custom script vaiable
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    //adding marker when click on map
    this._map.on('click', this._showForm.bind(this));

    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  _showForm(map_event) {
    //handling clicks on maps
    form.classList.remove('hidden');
    inputDistance.focus();
    this._mapEvent = map_event.latlng;
  }

  _toggleElevationField() {
    //selected parent div and toggle hidden class
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this._mapEvent;
    L.marker([lat, lng])
      .addTo(this._map)
      .bindPopup(
        L.popup({
          //creating popup object
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Workout')
      .openPopup();

    //clear input fields
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value =
      '';
    form.classList.add('hidden');
  }
}

const app = new App();
