'use strict';

class Workout {
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
    this._date = new Date();
    this._id = (Date.now() + '').slice(-10);
    this._clicks = 0;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this._description = `${this._type[0].toUpperCase()}${this._type.slice(
      1
    )} on ${months[this._date.getMonth()]} ${this._date.getDate()}`;
  }
  //public method
  clicks() {
    this._clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._type = 'running';
    this._setDescription();
  }

  _calcPace() {
    //min/km
    this._pace = this.duration / this.distance;
    return this._pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._type = 'cycling';
    this._setDescription();
  }

  _calcSpeed() {
    //km/h
    this._speed = this.distance / (this.duration / 60);
    return this._speed;
  }
}

const run1 = new Running([34, 56], 5.2, 24, 178);
const cycl1 = new Cycling([34, -56], 27, 95, 523);

///////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  //construtor loads asap  when the page loads
  constructor() {
    this._mapZoomLevel = 13;
    this._map;
    this._mapEvent;
    this._workouts = [];

    //get users positions
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMaps.bind(this),
        function () {
          console.log('Could not get position');
        }
      );
  }

  _loadMaps(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this._map = L.map('map').setView(coords, this._mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    this._map.on('click', this._showForm.bind(this));
    //after map loads add the markers from local store
    this._workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(map_event) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this._mapEvent = map_event.latlng;
  }

  _hideForm() {
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value =
      '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    //helper function
    //rest gives an array
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); //if all true every will return true

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._mapEvent;
    let workout;
    //If workout running , create running object
    if (type === 'running') {
      //Check if data is valid

      const cadance = +inputCadence.value;
      //gards to check the input is number
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadance)
        !validInputs(distance, duration, cadance) ||
        !allPositive(distance, duration, cadance)
      )
        return console.log('Positive Number');

      workout = new Running([lat, lng], distance, duration, cadance);
    }
    //if workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return console.log('Positive Number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this._workouts.push(workout);

    //render workout
    this._renderWorkOut(workout);
    //Render workout on map as marker

    //this._workouts.
    this._renderWorkoutMarker(workout);

    //Hide the form and clear input field

    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout._type}-popup`,
        })
      )
      .setPopupContent(
        `${workout._type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout._description}`
      )
      .openPopup();
  }

  _renderWorkOut(workout) {
    let html = `
    
    <li class="workout workout--${workout._type}" data-id="${workout._id}">
    <h2 class="workout__title">${workout._description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout._type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
   
  
    
    `;

    if (workout._type === 'running')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout._pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">178</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
      `;

    if (workout._type === 'cycling')
      html += `
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout._speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
        `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    //getting the paren element
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;
    const workout = this._workouts.find(
      work => work._id === workoutEl.dataset.id
    );

    this._map.setView(workout.coords, this._mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //using the public interface
    //workout.clicks();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this._workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this._workouts = data;
    this._workouts.forEach(work => {
      this._renderWorkOut(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
