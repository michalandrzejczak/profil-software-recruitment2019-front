import API_KEY from '../../api.config';
import axios from 'axios';
import { isMissing } from './_utils.js';
import '../sass/main.scss';

const resultsObject = {
    page:          0,
    searchResults: [],
    shows:         [],
    count() {
        return this.shows.length;
    },
};


const statusObject = {
    loading:      false,
    completed:    false,
    error:        false,
    errorMessage: '',
    clear() {
        this.loading      = false;
        this.completed    = false;
        this.error        = false;
        this.errorMessage = '';
    },
};

const queryObject = {
    async searchTitle(query) {
        statusObject.clear();

        await axios.all([
            axios.get('http://www.omdbapi.com/', {
                params: {
                    apikey: API_KEY,
                    type:   'series',
                    s:      query,
                    page:   1,
                },
            }),
            axios.get('http://www.omdbapi.com/', {
                params: {
                    apikey: API_KEY,
                    type:   'series',
                    s:      query,
                    page:   2,
                },
            }),
        ])
        .then(axios.spread((responseFirstPage, responseSecondPage) => {
            resultsObject.searchResults = [...this.getIds(responseFirstPage.data.Search)];
        }))
        .catch(error => {
            statusObject.error        = true;
            statusObject.errorMessage = error.message;
        })
        .finally(response => {
            statusObject.completed = true;
        });

        for (let id of resultsObject.searchResults) {
            await this.getShowDetails(id).then(response => {
                resultsObject.shows.push({
                    id:          response.imdbID,
                    title:       response.Title,
                    released:    isMissing(response.Released) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Released,
                    runtime:     isMissing(response.Runtime) ? `<span class="result-element__attr--missing">Missing info</span>` : response.Runtime,
                    rating:      isMissing(response.imdbRating) ? '<span class="result-element__attr--missing">Missing info</span>' : response.imdbRating,
                    description: isMissing(response.Plot) ? '<span class="result-element__attr--missing">Missing Description</span>' : response.Plot.substr(0, 100) + '...',
                    awarded:     !isMissing(response.Awards),
                    poster:      isMissing(response.Poster) ? '/assets/default_poster.png' : response.Poster,
                });
            });
        }

        printResults(resultsObject.shows);
    },

    getShowDetails(id) {
        return axios.get('http://www.omdbapi.com/', {
            params: {
                apikey: API_KEY,
                i:      id,
            },
        })
        .then(response => {
                return response.data;
            },
        )
        .catch(error => {
            statusObject.error        = true;
            statusObject.errorMessage = error.message;
        })
        .finally(response => {
            statusObject.completed = true;
        });
    },

    getIds(searchResults) {
        return searchResults.map(result => result.imdbID);
    },
};

function printResults(dataArray) {
    const $resultsContainer = $('#results-container');
    const resultsToPrint    = [];


    if (!statusObject.error) {
        dataArray.forEach(show => {
            resultsToPrint.push(`
            <div class="result-element">
                <span class="result-element__id">IMDB ID ${show.id}</span>
                ${show.awarded ? `<span class="result-element__awarded">Awarded</span>` : ''}
                <span class="clearfix"></span>
                <div class="result-element__grid">
                    <img class="result-element__poster" src="${show.poster}" alt="${show.title} poster">  
                    <span class="result-element__title">${show.title}</span>
                    <span>released <span class="result-element__released">${show.released}</span></span>     
                    <span>runtime <span class="result-element__runtime">${show.runtime}</span></span>     
                    <span>IMDB Rating <span class="result-element__rating">${show.rating}</span></span>
                </div>     
                <p class="result-element__description">${show.description}</p>     
            </div>
        `);
        });
        $resultsContainer.html(resultsToPrint);

        return true;
    }

    const errorMessage = `
        <div class="error-element">
            <p class="error-element__heading">Error!</p>
            <p class="error-element__message">${statusObject.errorMessage}</p>
        </div>
    `;

    $resultsContainer.html(errorMessage);

    return false;
}

(function () {
    $('#search-form').on('submit', function (e) {
        e.preventDefault();

        const query = $('input#search').val();

        queryObject.searchTitle(query);
    })
})();
