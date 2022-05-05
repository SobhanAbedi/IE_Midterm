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
        } else {
            if(typeof movie_id == "number") {
                if(movie_id >= 1 && movie_id <= 6)
                    movie_id = movie_id.toString(10);
                else {
                    return new Promise(function (resolve, reject) {
                        reject(new Error('Invalid movie_id number. movie_id should be between 1 to 6'));
                    });
                }
            }
            else {
                return new Promise(function (resolve, reject) {
                    reject(new Error('Invalid movie_id type. movie_id should be either a string or a number'));
                });
            }
        }
        return fetch('https://swapi.dev/api/films/'+movie_id)
            .then(response => {
                if(!response.ok)
                    throw new Error('Network response was not ok');
                return response.json();
            })
            .then(info => {
                this._title = info['title'];
                this._episode_id = info['episode_id'];
                this._release_date = info['release_date'];
                this._starships = info['starships'];
                //console.log(this.toString());
                //console.log(this.starships);
                //console.log(info);
                return this.toString();
            })
            .catch(error => {
                throw error;
            })
    }
};
let ep_ids = [4, 5, 6, 1, 2, 3];
let eps_info = new Array(6);

function fetch_info() {
    return new Promise(function (resolve, reject) {
        let promises = new Array(6);
        let i = 0;
        ep_ids.forEach(ep_id => {
            eps_info[i] = Object.create(MovieInfo);
            let p = eps_info[i].fetch_info(ep_id);
            promises.push(p);
            p
                .then( response => {
                    console.log(response);
                })
                .catch(error => {
                    reject(error);
                });
            i++;
        });
        Promise.allSettled(promises).then(() => resolve(eps_info));
    })
}

function load_movie_menu() {
    let box = document.getElementById('mainBox');
    let list = document.createElement("ul");
    eps_info.forEach(ep_info => {
        let item = document.createElement("li");
        let itemString = document.createElement("p");
        itemString.innerText = ep_info.toString();
        item.appendChild(itemString);
        list.appendChild(item);
    })
    box.appendChild(list);
}

fetch_info()
    .then( response => {
        console.log(response);
        load_movie_menu();
    })
    .catch(error => {
       console.error(error);
    });