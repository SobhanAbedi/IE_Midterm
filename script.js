let ep_ids = [];
ep_ids[1] = 4;
ep_ids[2] = 5;
ep_ids[3] = 6;
ep_ids[4] = 1;
ep_ids[5] = 2;
ep_ids[6] = 3;
let eps_info = [];
let starships_info = [];
let page = 0;
let cur_movie_id = 0;
const MAX_LIST_ITEMS = 10;
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
    cur_movie_id = 0;
    let box = document.getElementById("mainBox");
    let title = document.createElement("h1");
    title.classList.add("swColor");
    title.innerText = "Movies";
    let list = document.createElement("ul");
    eps_info.forEach(ep_info => {
        let item = document.createElement("li");
        item.classList.add("swFont");
        item.classList.add("swColor");
        let fBox = document.createElement("div");
        fBox.classList.add("MBFlex");
        let itemString = document.createElement("span");
        itemString.innerText = ep_info.toString();
        let starshipBtn = document.createElement("button");
        starshipBtn.classList.add("starshipBtn");
        starshipBtn.classList.add("btn");
        starshipBtn.innerText = "Starships";
        starshipBtn.onclick = () => {
            cur_movie_id = ep_info.episode_id;
            load_starship_menu();
        };
        fBox.appendChild(itemString);
        fBox.appendChild(starshipBtn);
        item.appendChild(fBox);
        list.appendChild(item);

    })
    box.replaceChildren(title, list);
}

function load_starship_list() {
    if(page < 0) {
        page = 0;
    }
    let shipCount = eps_info[cur_movie_id].starships.length;
    if(shipCount <= page * MAX_LIST_ITEMS)
        page--;
    let list = document.getElementById("starshipList");
    list.replaceChildren();

    let prevBtn = document.getElementById("prevBtn");
    if(page === 0)
        prevBtn.style.display = "none";
    else
        prevBtn.style.display = "inline-block";
    let nextBtn = document.getElementById("nextBtn");
    if(shipCount <= (page+1) * MAX_LIST_ITEMS)
        nextBtn.style.display = "none";
    else
        nextBtn.style.display = "inline-block";

    let count = (page+1) * MAX_LIST_ITEMS;
    eps_info[cur_movie_id].starships.forEach(starship => {
        count--;
        if(count < MAX_LIST_ITEMS && count >= 0) {
            let item = document.createElement('li');
            let index = parseInt(starship);
            item.innerText = starships_info[index].name;
            item.classList.add("btn");
            item.onclick = () => {
                load_starship_info(index);
            };
            list.appendChild(item);
        }
    });
}

function load_starship_info(starship_id) {
    if(starships_info[starship_id] === undefined)
        return;
    let starship = starships_info[starship_id];
    let header = document.querySelector("#starshipBox > h1");
    header.innerText = starship.name;
    let infoList = document.getElementById("SBFlex");
    infoList.replaceChildren();
    let simpleItems = ['model', 'manufacturer', 'crew', 'passengers'];
    simpleItems.forEach(item => {
        let info = document.createElement("div");
        info.classList.add("starshipInfo");
        info.innerText = item + ": " + starship[item];
        infoList.appendChild(info);
    });
    let films = starship.films;
    films.forEach(film => {
        let film_info = eps_info[ep_ids[parseInt(film)]];
        if(film_info === undefined)
            return;
        let info = document.createElement("div");
        info.classList.add("movieLink");
        info.classList.add("btn");
        info.innerText = film_info.title;
        info.onclick = () => {
            cur_movie_id = film_info.episode_id;
            load_starship_menu();
        };
        infoList.appendChild(info);
    });
}

function load_starship_menu() {
    let backBtn = document.createElement("h3");
    backBtn.innerText = "Back to Movies";
    backBtn.id = "BTM_Btn";
    backBtn.classList.add('swColor');
    backBtn.classList.add('btn');
    backBtn.onclick = load_movie_menu;

    page = 0;
    let starshipList = document.createElement("div");
    starshipList.id = "starshipListContainer";
    let listHeader = document.createElement("h1");
    listHeader.innerText = "Starships";
    listHeader.classList.add("whiteColor");
    starshipList.appendChild(listHeader);
    let list = document.createElement('ul');
    list.id = "starshipList";
    starshipList.appendChild(list);

    let navMenu = document.createElement("div");
    navMenu.classList.add("navMenu");
    let prevBtn = document.createElement('h5');
    prevBtn.innerText = "< Prev";
    prevBtn.classList.add("btn");
    prevBtn.id = "prevBtn";
    prevBtn.onclick = () => {
        if(page > 0) {
            page--;
            load_starship_list();
        }
    }
    let nextBtn = document.createElement('h5');
    nextBtn.innerText = "Next >";
    nextBtn.classList.add("btn");
    nextBtn.id = "nextBtn";
    nextBtn.onclick = () => {
        page++;
        load_starship_list();
    }
    navMenu.append(prevBtn, nextBtn);
    starshipList.appendChild(navMenu);

    let starshipBox = document.createElement("div");
    starshipBox.id = "starshipBox";
    let boxHeader = document.createElement("h1");
    boxHeader.innerText = "Select A Starship";
    boxHeader.classList.add("whiteColor");
    starshipBox.appendChild(boxHeader);
    let starshipInfoBox = document.createElement("div");
    starshipInfoBox.id = "SBFlex";
    starshipBox.appendChild(starshipInfoBox);

    let flexBox = document.createElement("div");
    flexBox.classList.add("MBFlex");
    flexBox.id = "starshipFlex";
    flexBox.appendChild(backBtn);
    flexBox.appendChild(starshipList);
    flexBox.appendChild(starshipBox);

    let mainBox = document.getElementById("mainBox");
    mainBox.replaceChildren(flexBox);
    load_starship_list();
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