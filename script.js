let ep_ids = [4, 5, 6, 1, 2, 3];
let eps_info = [];
let starships_info = [];

//const BASE_ADDRESS = 'https://swapi.dev/api/'
const BASE_ADDRESS = 'cache/'

let MovieInfo = {
    _title : "",
    _episode_id : 0,
    _release_date : "",
    _starships: [],

    get title() {
        return this._title;
    },

    get episode_id() {
        return this._episode_id;
    },

    get release_date() {
        return this._release_date;
    },

    get starships() {
        return this._starships;
    },

    toString() {
        return `Episode ${this._episode_id}: ${this._title} (${this._release_date})`;
    },

    fetch_info(movie_id) {
        const regex = /^[1-6]$/;
        if(typeof movie_id == "string") {
            if(!regex.test(movie_id)) {
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid movie_id string. movie_id should be between "1" to "6"'));
                });
            }
        } else if(typeof movie_id == "number") {
            if(movie_id >= 1 && movie_id <= 6)
                movie_id = movie_id.toString(10);
            else {
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid movie_id number. movie_id should be between 1 to 6'));
                });
            }
        } else {
            return new Promise(function (resolve, reject) {
                reject(new Error('Invalid movie_id type. movie_id should be either a string or a number'));
            });
        }
        return fetch(BASE_ADDRESS+'films/'+movie_id)
            .then(response => {
                if(!response.ok)
                    throw new Error('Network response was not ok');
                return response.json();
            })
            .then(info => {
                this._title = info['title'];
                this._episode_id = info['episode_id'];
                this._release_date = info['release_date'];
                //this._starships = info['starships'];
                this._starships = [];
                let promises = info['starships'].map(starship => {
                    let starship_id = (new URL(starship)).pathname.split('/')[3];
                    this._starships.push(starship_id);
                    if(starships_info[starship_id] === undefined) {
                        starships_info[starship_id] = Object.create(StarshipInfo);
                        return starships_info[starship_id].fetch_info(starship_id)
                            .then( response => {
                                return response;
                            })
                            .catch(error => {
                                console.error(error);
                                throw error;
                            });
                    } else {
                        return starships_info[starship_id].toString();
                    }
                });
                Promise
                    .all(promises).then(() => {
                        return info
                    })
                    .catch(error => {
                        return error;
                    })

                //Promise.allSettled(promises).then(() => {return this.toString();});
            })
            .catch(error => {
                throw error;
            })
    }
};

let StarshipInfo = {
    _name : "",
    _model : "",
    _manufacturer : "",
    _crew : "",
    _passengers : "",
    _films: [],

    get name() {
        return this._name;
    },

    get model() {
        return this._model;
    },

    get manufacturer() {
        return this._manufacturer;
    },

    get crew() {
        return this._crew;
    },

    get passengers() {
        return this._passengers;
    },

    get films() {
        return this._films;
    },

    toString() {
        return `${this._model} by ${this._manufacturer}, crewed by${this._crew} can transport ${this._passengers} passengers`;
    },

    fetch_info(ship_id) {
        const regex = /^[1-7]?\d?$/;
        if(typeof ship_id == "string") {
            if(!regex.test(ship_id)) {
                return new Promise(function (resolve, reject) {
                    console.error(ship_id);
                    reject(new Error('Invalid ship_id string. ship_id should be between "0" to "79"'));
                });
            }
        } else if(typeof ship_id == "number") {
            if(ship_id >= 2 && ship_id <= 75)
                ship_id = ship_id.toString(10);
            else {
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid ship_id number. ship_id should be between 2 to 75'));
                });
            }
        } else {
            return new Promise(function (resolve, reject) {
                reject(new Error('Invalid ship_id type. ship_id should be either a string or a number'));
            });
        }
        return fetch(BASE_ADDRESS+'starships/'+ship_id)
            .then(response => {
                if(!response.ok)
                    throw new Error('Network response was not ok');
                return response.json();
            })
            .then(info => {
                this._name = info['name'];
                this._model = info['model'];
                this._manufacturer = info['manufacturer'];
                this._crew = info['crew'];
                this._passengers = info['passengers'];
                this._films = [];
                info['films'].forEach(film => {
                    let film_id = (new URL(film)).pathname.split('/')[3];
                    this._films.push(film_id);
                });
                return this.toString();
            })
            .catch(error => {
                throw error;
            })
    }
};

function fetch_info() {
    return new Promise(function (resolve, reject) {
        let promises = new Array(6);
        ep_ids.forEach(ep_id => {
            let temp_info = Object.create(MovieInfo);
            let p = temp_info.fetch_info(ep_id);
            promises.push(p);
            p
                .then( () => {
                    eps_info[temp_info.episode_id] = temp_info;
                })
                .catch(error => {
                    reject(error);
                });
        });
        Promise.allSettled(promises).then(() => resolve(eps_info));
    })
}

function load_movie_menu() {
    let box = document.getElementById("mainBox");
    let title = document.createElement("h1");
    title.classList.add("swColor");
    title.innerText = "Movies";
    box.appendChild(title);
    let list = document.createElement("ul");
    eps_info.forEach(ep_info => {
        let item = document.createElement("li");
        item.classList.add("swFont");
        item.classList.add("swColor");
        let fBox = document.createElement("div");
        fBox.classList.add("MBFlex");
        let itemString = document.createElement("span");
        itemString.innerText = ep_info.toString();
        let starShipBtn = document.createElement("button");
        starShipBtn.innerText = "Starships";
        fBox.appendChild(itemString);
        fBox.appendChild(starShipBtn);
        item.appendChild(fBox);
        list.appendChild(item);

    })
    box.appendChild(list);
}

fetch_info()
    .then( response => {
        console.log(response);
        load_movie_menu();
        console.log(starships_info);
    })
    .catch(error => {
       console.error(error);
    });