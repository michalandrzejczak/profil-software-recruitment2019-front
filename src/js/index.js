import API_KEY from '../../api.config';
import axios from 'axios';
import { isMissing } from './_utils.js';
import '../sass/main.scss';
import _ from 'lodash';

(function () {
    const BATCH_SIZE        = 12;
    const $resultsContainer = $('#results-container');
    let resultsToPrint      = [];

    const resultsObject = {
        page:          0,
        totalResults:  0,
        searchResults: [],
        shows:         [],
        searchResultsCount() {
            return this.searchResults.length;
        },
        showsCount() {
            return this.shows.length;
        },
        clear() {
            this.page          = 0;
            this.totalResults  = 0;
            this.searchResults = [];
            this.shows         = [];

        },
    };


    const statusObject = {
        loading:      false,
        completed:    false,
        error:        false,
        limitReached: false,
        errorMessage: '',
        clear() {
            this.loading      = false;
            this.completed    = false;
            this.error        = false;
            this.limitReached = false;
            this.errorMessage = '';
        },
    };

    const queryObject = {
        async searchTitle(query) {
            await resultsObject.clear();
            await statusObject.clear();
            resultsToPrint = [];
            await $resultsContainer.html('');

            await axios.get('http://www.omdbapi.com/', {
                params: {
                    apikey: API_KEY,
                    type:   'series',
                    s:      query,
                    page:   1,
                },
            }).then(responseFirstPage => {
                resultsObject.searchResults = [...this.getIds(responseFirstPage.data.Search)];
                resultsObject.totalResults  = responseFirstPage.data.totalResults;
                resultsObject.page++;
                if (resultsObject.totalResults >= 12) {
                    axios.get('http://www.omdbapi.com/', {
                        params: {
                            apikey: API_KEY,
                            type:   'series',
                            s:      query,
                            page:   2,
                        },
                    })
                    .then(responseSecondPage => {
                        resultsObject.searchResults = [...resultsObject.searchResults, ...this.getIds(responseSecondPage.data.Search)];
                        resultsObject.page++;
                    })
                    .catch(error => {
                        statusObject.error        = true;
                        statusObject.errorMessage = error.message;
                    })
                }
            })
            .catch(error => {
                statusObject.error        = true;
                statusObject.errorMessage = error.message;
            }).finally(response => {
                statusObject.completed = true;
            });

            let endIndex = resultsObject.searchResultsCount() <= resultsObject.totalResults ? BATCH_SIZE : resultsObject.totalResults;

            for (let id of resultsObject.searchResults.slice(0, endIndex)) {
                await this.getShowDetails(id).then(response => {
                    resultsObject.shows.push({
                        id:          response.imdbID,
                        title:       response.Title,
                        released:    isMissing(response.Released) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Released,
                        runtime:     isMissing(response.Runtime) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Runtime,
                        rating:      isMissing(response.imdbRating) ? '<span class="result-element__attr--missing">Missing info</span>' : response.imdbRating,
                        description: isMissing(response.Plot) ? '<span class="result-element__attr--missing">Missing Description</span>' : response.Plot.substr(0, 100) + '...',
                        awarded:     !isMissing(response.Awards),
                        poster:      isMissing(response.Poster) ? '/assets/default_poster.png' : response.Poster,
                    });
                });
            }

            printResults(resultsObject.shows);

            if (resultsObject.searchResultsCount() >= resultsObject.totalResults) {
                statusObject.limitReached = true;
                $resultsContainer.append(`<p class="results-container__limit">No more results</p>`);
            }
        },

        async loadMore(query) {
            if (resultsObject.searchResultsCount() - resultsObject.showsCount() >= BATCH_SIZE ||
                resultsObject.searchResultsCount() == resultsObject.totalResults) {


                let startIndex = BATCH_SIZE * (resultsObject.page - 1);
                let endIndex   = resultsObject.searchResultsCount() == resultsObject.totalResults ? resultsObject.totalResults : BATCH_SIZE * resultsObject.page;

                for (let id of resultsObject.searchResults.slice(startIndex, endIndex)) {
                    await this.getShowDetails(id).then(response => {
                        resultsObject.shows.push({
                            id:          response.imdbID,
                            title:       response.Title,
                            released:    isMissing(response.Released) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Released,
                            runtime:     isMissing(response.Runtime) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Runtime,
                            rating:      isMissing(response.imdbRating) ? '<span class="result-element__attr--missing">Missing info</span>' : response.imdbRating,
                            description: isMissing(response.Plot) ? '<span class="result-element__attr--missing">Missing Description</span>' : response.Plot.substr(0, 100) + '...',
                            awarded:     !isMissing(response.Awards),
                            poster:      isMissing(response.Poster) ? '/assets/default_poster.png' : response.Poster,
                        });
                    });
                }

                printResults(resultsObject.shows.slice(startIndex, endIndex));

                if (resultsObject.searchResultsCount() == resultsObject.totalResults) {
                    statusObject.limitReached = true;
                    $resultsContainer.append(`<p class="results-container__limit">No more results</p>`);
                }
            } else {
                statusObject.clear();
                let startIndex = BATCH_SIZE * (resultsObject.page - 1);
                let endIndex   = resultsObject.searchResultsCount() === resultsObject.totalResults ? resultsObject.totalResults : BATCH_SIZE * resultsObject.page;

                await axios.get('http://www.omdbapi.com/', {
                    params: {
                        apikey: API_KEY,
                        type:   'series',
                        s:      query,
                        page:   resultsObject.page + 1,
                    },
                })
                .then(responsePage => {
                    resultsObject.searchResults = [...resultsObject.searchResults, ...this.getIds(responsePage.data.Search)];
                    resultsObject.page++;
                })
                .catch(error => {
                    statusObject.error        = true;
                    statusObject.errorMessage = error.message;
                })
                .finally(response => {
                    statusObject.completed = true;
                });

                for (let id of resultsObject.searchResults.slice(startIndex, endIndex)) {
                    await this.getShowDetails(id).then(response => {
                        resultsObject.shows.push({
                            id:          response.imdbID,
                            title:       response.Title,
                            released:    isMissing(response.Released) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Released,
                            runtime:     isMissing(response.Runtime) ? '<span class="result-element__attr--missing">Missing info</span>' : response.Runtime,
                            rating:      isMissing(response.imdbRating) ? '<span class="result-element__attr--missing">Missing info</span>' : response.imdbRating,
                            description: isMissing(response.Plot) ? '<span class="result-element__attr--missing">Missing Description</span>' : response.Plot.substr(0, 100) + '...',
                            awarded:     !isMissing(response.Awards),
                            poster:      isMissing(response.Poster) ? '/assets/default_poster.png' : response.Poster,
                        });
                    });
                }

                printResults(resultsObject.shows.slice(startIndex, endIndex));

            }
        },

        getShowDetails(id) {
            return axios.get('http://www.omdbapi.com/', {
                params: {
                    apikey: API_KEY,
                    i:      id,
                },
            })
            .then(response => response.data)
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
        } else {
            const errorMessage = `
                <div class="error-element">
                    <p class="error-element__heading">Error!</p>
                    <p class="error-element__message">${statusObject.errorMessage}</p>
                </div>
            `;

            $resultsContainer.html(errorMessage);
        }
    }

    let searchQuery;

    $('#search-form').on('submit', function (e) {
        e.preventDefault();
        searchQuery = $('input#search').val();
        queryObject.searchTitle(searchQuery);
    });


    $(window).on('scroll', _.debounce(async () => {
        let isBottom = document.documentElement.scrollTop + window.innerHeight === $(document).innerHeight();

        if (isBottom && resultsObject.searchResultsCount() && !statusObject.limitReached) {
            await queryObject.loadMore(searchQuery);
        }
    }, 500));

})();
