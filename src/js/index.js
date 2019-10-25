import API_KEY from '../../api.config';
import axios from 'axios';
import '../sass/main.scss';


const queryObject = {
    searchTitle(query) {
        statusObject.clear();

        axios.get('http://www.omdbapi.com/', {
            params: {
                apikey: API_KEY,
                type:   'series',
                s:      query,
            },
        })
        .then(response => {
            statusObject.loading = true;
            printResults(response.data.Search);
        })
        .catch(error => {
            statusObject.error        = true;
            statusObject.errorMessage = error;
        })
        .finally(response => {
            statusObject.completed = true;
        });
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

async function printResults(data) {
    const $searchResults = $('#search-results');
    const htmlToPrint    = [];

    await data.forEach(show => {
        let name = show.Title;
        htmlToPrint.push(`
            <div class="result-container">
                <p class="name">${name}</p>
            </div>
        `);
    });

    $searchResults.html(htmlToPrint);
}

(function () {
    $('#search-form').on('submit', function (e) {
        e.preventDefault();

        const query = $('#search-input').val();
        queryObject.searchTitle(query);
    });
})();
