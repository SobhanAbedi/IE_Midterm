// an array that translates episodes urls to episode id
let ep_ids = [];
ep_ids[1] = 4;
ep_ids[2] = 5;
ep_ids[3] = 6;
ep_ids[4] = 1;
ep_ids[5] = 2;
ep_ids[6] = 3;

// an array to hold info for each film episode. will be populated with MovieInfo objects
let eps_info = [];
// an array to hold info for each starship. will be populated with StarshipInfo objects
let starships_info = [];

// two global variable that hold the page number and movie_id for which the starship list is currently being displayed
let page = 0;
let cur_movie_id = 0;
// maximum number of starships that will be shown in a page
const MAX_LIST_ITEMS = 10;

/**
 * The base address for fetch request.
 * I have cached the json files in local directory to have less lag during development and put less load on SWAPI.
 * But it can be changed back easily for testing.
 */
//const BASE_ADDRESS = 'https://swapi.dev/api/'
const BASE_ADDRESS = 'cache/'

/**
 * This function sets the given function for element's onclick and makes the element tabable and makes the
 * element clicked when the Enter key is pressed and the element is selected using tab.
 * @param element element to make clickable and tabable
 * @param func function to run when clicked or pressed Enter
 */
function makeClickable(element, func) {
    element.onclick = func;
    element.tabIndex = 0;
    element.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            element.click();
        }
    });
}

/**
 * Object prototype holding information for each movie.
 * The items are {title, episode_id, release_date, starships}.
 * All the items are implemented in a readonly manner and can only be written to using the fetch_info function.
 */
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

    /**
     * toString function returns a string that forms a meaningful sentence which shows most of the variables in
     * MovieInfo object. This function is mostly used for debugging.
     * @returns {string}
     */
    toString() {
        return `Episode ${this._episode_id}: ${this._title} (${this._release_date})`;
    },

    /**
     * The fetch_info function fetches the json from SWAPI (or cache) and populates object variables with proper values.
     * Because the webpage is generated based on the information that this function fetches, we should make sure that
     * information has been fully fetched before we can generate the webpage. Thus, this function returns a promise
     * which resolves only when the information has been fully fetched or there has been an error.
     * @param movie_id (the fetch address for movie episode)
     * @returns {Promise<unknown>|Promise<any>}
     */
    fetch_info(movie_id) {
        // Because movie_id doesn't have a specific type. in this section we make sure it is of string type
        // and has valid value between "1" and "6"
        // Also, only string and number input types can be accepted.
        // Otherwise, there will be a rejected promise returned.
        // this regex only accepts single digits between "1" an "6"
        const regex = /^[1-6]$/;
        if(typeof movie_id == "string") {
            if(!regex.test(movie_id)) {
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid movie_id string. movie_id should be between "1" and "6"'));
                });
            } //else: we have the desired string
        } else if(typeof movie_id == "number") {
            if(movie_id >= 1 && movie_id <= 6)
                //convert number to string
                movie_id = movie_id.toString(10);
            else {
                //out of range
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid movie_id number. movie_id should be between 1 and 6'));
                });
            }
        } else {
            return new Promise(function (resolve, reject) {
                reject(new Error('Invalid movie_id type. movie_id should be either a string or a number'));
            });
        }

        // return the result of the fetch
        return fetch(BASE_ADDRESS+'films/'+movie_id)
            // if the response was not ok, throws an error that should be caught by the caller.
            // Otherwise, turns the response into json object and return it to be used in the next section.
            .then(response => {
                if(!response.ok)
                    throw new Error('Network response was not ok');
                return response.json();
            })
            /**
             * This section parses the returned json object into needed information by MovieInfo object.
             * For each starship instead of its URL, only its ID will be stored in the starships array and
             * at the same time the starship_info array will be checked to see if the array item with the same
             * starship_id exists or not. If it exists, the information for this starship has been fetched previously.
             * Otherwise, a new StarshipInfo object will be created and placed at starship_id index of the array
             * and the information for it will be fetched.
             * the fetch_info function in StarshipInfo object also returns a promise.
             * Thus, we should return the promise for this function only when all the StarshipInfo promises have been
             * resolved and only return a successful promise when all the promises have been successful.
             */
            .then(info => {
                this._title = info['title'];
                this._episode_id = info['episode_id'];
                this._release_date = info['release_date'];
                //this._starships = info['starships'];
                this._starships = [];
                // Map each starship_id into a promise for its information to be fetched
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
                        return info;
                    })
                    .catch(error => {
                        return error;
                    })

                // Other method to check if all the promises have been settled
                //Promise.allSettled(promises).then(() => {return this.toString();});
            })
            // If there has been an error in fetching the information (contacting the api) an error will be thrown.
            // The error should be caught by the caller.
            .catch(error => {
                throw error;
            })
    }
};

/**
 * Object prototype holding information for each starship.
 * The items are {name, model, manufacturer, crew, passengers, films}.
 * All the items are implemented in a readonly manner and can only be written to using the fetch_info function.
 */
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

    /**
     * toString function returns a string that forms a meaningful sentence which shows most of the variables in
     * StarshipInfo object. This function is mostly used for debugging.
     * @returns {string}
     */
    toString() {
        return `${this._model} by ${this._manufacturer}, crewed by${this._crew} can transport ${this._passengers} passengers`;
    },

    /**
     * The fetch_info function fetches the json from SWAPI (or cache) and populates object variables with proper values.
     * Because the webpage is generated based on the information that this function fetches, we should make sure that
     * information has been fully fetched before we can generate the webpage. Thus, this function returns a promise
     * which resolves only when the information has been fully fetched or there has been an error.
     * @param ship_id (the fetch address for starship)
     * @returns {Promise<unknown>|Promise<any>}
     */
    fetch_info(ship_id) {
        // Because ship_id doesn't have a specific type. in this section we make sure it is of string type
        // and has a valid value between "0" and "79". Although no all the values in this range are truly valid
        // but because the values come from the fetched items in MovieInfo object, the values are assumed to be valid.
        // Otherwise, there will be a rejected promise returned.
        // Also, only string and number input types can be accepted.

        // this regex only accepts single digits between "0" an "79"
        const regex = /^[1-7]?\d?$/;
        if(typeof ship_id == "string") {
            if(!regex.test(ship_id)) {
                return new Promise(function (resolve, reject) {
                    console.error(ship_id);
                    reject(new Error('Invalid ship_id string. ship_id should be between "0" to "79"'));
                });
            } //else: we have the desired string
        } else if(typeof ship_id == "number") {
            if(ship_id >= 2 && ship_id <= 75)
                //convert number to string
                ship_id = ship_id.toString(10);
            else {
                //out of range
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid ship_id number. ship_id should be between 2 to 75'));
                });
            }
        } else {
            return new Promise(function (resolve, reject) {
                reject(new Error('Invalid ship_id type. ship_id should be either a string or a number'));
            });
        }

        // return the result of the fetch
        return fetch(BASE_ADDRESS+'starships/'+ship_id)
            // if the response was not ok, throws an error that should be caught by the caller.
            // Otherwise, turns the response into json object and return it to be used in the next section.
            .then(response => {
                if(!response.ok)
                    throw new Error('Network response was not ok');
                return response.json();
            })
            /**
             * This section parses the returned json object into needed information by StarshipInfo object.
             * For each movie instead of its URL, only its ID will be stored in the films array.
             * This section only returns a promise when the information has been fetched or there has been an error.
             */
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

/**
 * This function generates MovieInfo objects for all the movie_ids in the ep_ids array
 * and fetches the information for that movie.
 * each movie also makes sure the information for the starships in that movie, have been fetched.
 * Thus, by the end of this function all the needed information will be fetched.
 * The information fetched by this function is needed for generating the webpage. Thus, this function should return
 * a Promise; And it should only be returned when all the information has been fetched.
 * @returns {Promise<unknown>}
 */
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
    });
}


/**
 * This function generates the movie menu in the mainBox object.
 * The items placed in the mainBox are an h1 header and a ul unordered list.
 * each li inside ul, hold a flexbox in which there are a span for movie information
 * and a button which loads the starships.
 * for each button the onclick value is set to a new function which sets the cur_movie_id and then calls the
 * load_starship_menu function which clears the movie_menu page and loads starship_menu page.
 * the starship_menu page will be loaded based on the cur_movie_id.
 * To clear the old children of mainBox and replace them with new elements generated in this function,
 * we use the replaceChildren function at the end of this function when all the elements have been generated
 * to have the least amount of time when the mainBox isn't valid.
 */
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
        makeClickable(starshipBtn, () => {
            cur_movie_id = ep_info.episode_id;
            load_starship_menu();
        });
        fBox.appendChild(itemString);
        fBox.appendChild(starshipBtn);
        item.appendChild(fBox);
        list.appendChild(item);

    })
    box.replaceChildren(title, list);
}

/**
 * This function checks if the page value is valid in relation to MAX_LIST_ITEMS and the number of elements in
 * ships array of the MovieInfo whit cur_movie_id.
 * If the page value was valid, then the prev and next buttons are shown or hidden based on weather there are
 * next or previous pages available. then the previous elements in starshipList are removed and the starships
 * in the correct range are loaded into it.
 */
function load_starship_list() {
    // Check page validity
    if(page < 0) {
        page = 0;
    }
    let ships = eps_info[cur_movie_id].starships;
    let shipCount = ships.length;
    if(shipCount <= page * MAX_LIST_ITEMS)
        page--;

    // Display or hide prev and next buttons
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

    // Remove previous elements and load the new ones
    let list = document.getElementById("starshipList");
    list.replaceChildren();
    for(let i = page*MAX_LIST_ITEMS; i < (page+1)*MAX_LIST_ITEMS && i < shipCount; i++) {
        let item = document.createElement('li');
        let index = parseInt(ships[i]);
        item.innerText = starships_info[index].name;
        item.classList.add("btn");
        makeClickable(item, () => {
            load_starship_info(index);
        });
        list.appendChild(item);
    }
}

/**
 * This function loads the information for the given starship_id into the starshipBox.
 * The name of the starship will be laded into the h1 header of the starshipBox and the variables other than
 * films array will be loaded into the SBFlex flexbox as divs with starshipInfo class. These items will be simple
 * information blocks. But the films will be loaded as divs with movieLink class. These items will be clickable
 * blocks with different color and font which will change the page to the starships for that movie.
 * @param starship_id
 */
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
        makeClickable(info, () => {
            cur_movie_id = film_info.episode_id;
            load_starship_menu();
        });

        infoList.appendChild(info);
    });
}

/**
 * This function generates the starship_menu in the mainBox object.
 * The item placed in the mainBox is only a flexbox.
 * this flex box contains 3 divs which are placed in a row but when the display gets too narrow
 * they will be placed in a column.
 *
 * The first div contains an h3 element which is used as a button to return to movie_menu page.
 * An h3 element was used insted of a button element because it allowed more flexibility for writing vertical text
 * inside it and on a functional level it doesn't make much of a difference.
 *
 * The second div contains an h1 header, an unordered list of starships and a nav menu which has two floating h5
 * elements which are used as prev and next buttons. Each element will be displayed only when the prev or next pages
 * are actually available. the unordered list at max will contain MAX_LIST_ITEM number of starships.
 * To make the program more modular the starship list is loaded using load_starship_list function.
 *
 * The third div contains an h1 header and a flexbox. The h1 either says "Select A Starship" or if a starship has been
 * selected the name of the starship will be displayed. If a starship is selected the flexbox will contain a number of
 * divs which display the starship information. each div is designed like a box and the flexbox can be wrapped.
 * Therefor when the display size changes, the information rearrange to take up the least space.
 *
 * To clear the old children of mainBox and replace them with new elements generated in this function,
 * we use the replaceChildren function at the end of this function when all the elements have been generated
 * to have the least amount of time when the mainBox isn't valid.
 * Because the load_starship_list function works based on elements already being generated, we can only call
 * this function after replaceChildren function has already been called. It isn't much of a problem because the
 * main part of the page will be loaded but the list will be populated afterwards.
 */
function load_starship_menu() {
    let backBtn = document.createElement("h3");
    backBtn.innerText = "Back to Movies";
    backBtn.id = "BTM_Btn";
    backBtn.classList.add('swColor');
    backBtn.classList.add('btn');
    makeClickable(backBtn, load_movie_menu);

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
    makeClickable(prevBtn, () => {
        if(page > 0) {
            page--;
            load_starship_list();
        }
    });
    let nextBtn = document.createElement('h5');
    nextBtn.innerText = "Next >";
    nextBtn.classList.add("btn");
    nextBtn.id = "nextBtn";
    makeClickable(nextBtn, () => {
        page++;
        load_starship_list();
    });
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

/**
 * This section is run after the html base page has been loaded and fetches the information.
 * When the information has been fetched correctly, the load_movie_menu function will be called to load
 * the first page of this website.
 */
fetch_info()
    .then( response => {
        console.log(response);
        load_movie_menu();
        console.log(starships_info);
    })
    .catch(error => {
       console.error(error);
    });