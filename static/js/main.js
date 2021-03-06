/**
 * JS for templates/main.html
 * 
 * Oscar Jaimes
 * Novermer 24  2020
 */

let randomButton = document.getElementById('generate-random');
let newsLoading = document.getElementById('news-loading');
let loading1 = document.getElementById('loading1');
let loading2 = document.getElementById('loading2');
let stats1 = document.getElementById('stats1');
let stats2 = document.getElementById('stats2');

let newsList = document.getElementById('news-list');
let openStat = document.getElementById('open')
let high = document.getElementById('high')
let low = document.getElementById('low');
let cap = document.getElementById('cap');
let vol = document.getElementById('vol');
let avgVol = document.getElementById('avg-vol');
let high52 = document.getElementById('52w-high');
let low52 = document.getElementById('52w-low');

$(document).ready(() => {
    // Get random stock button
    $('#generate-random').on("click", () => {
        let market = document.getElementById('market-select').value;
        let sector = document.getElementById('sector-select').value;
        document.getElementById("generate-random").disabled = true;
        if (market == "") {
            swal('Invalid market choice.\nPlease choose one of the markets listed')
        } else {
            $.ajax({
                url: `../../${market}?sector=${sector}`,
                error: async () => {
                    swal('Looks like there was an error behind the scenes. Not to worry, TLSA or PLTR will save the day');
                    // If request fails, its a 50/50 between TSLA and PLTR. 
                    // Update as meme stocks meta changes.
                    console.warn("Error generating ticker symbol. TSLA or PLTR will save the day.");
                    let randInt = Math.floor(Math.random() * 100)
                    if (randInt % 2 == 0) {
                        await populateResultsSection('TSLA', 'NASDAQ');
                    } else {
                        await populateResultsSection('PLTR', 'NYSE');
                    }
                    setTimeout(function () { randomButton.disabled = false; }, 5000);
                },
                success: async (data) => {
                    await populateResultsSection(data, document.getElementById('market-select').options[document.getElementById('market-select').selectedIndex].text).then(() => {
                        setTimeout(function () { randomButton.disabled = false; }, 5000);
                    });
                },
                statusCode: {
                    429: function (xhr) {
                        swal(xhr.responseText);
                    },
                },
                type: 'GET'
            });
        }
    })
});

const populateResultsSection = async (tickerSymbol, market) => {
    // Get Trading View stock graph for corresponding ticker
    new TradingView.widget(
        {
            "width": screen.width * 0.9,
            "height": 475,
            "symbol": market + ":" + tickerSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "light",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_6b594"
        }
    );

    // Fill in market and ticker fields
    document.getElementById('chosen-market').innerHTML = market;
    document.getElementById('ticker-symbol').innerHTML = tickerSymbol;

    // Populate Stats
    await populateStatisticsSection(tickerSymbol)

    // Populate News
    await fetchStockNews(tickerSymbol);
}

const populateStatisticsSection = async (tickerSymbol) => {
    loading1.style.display = 'block';
    loading2.style.display = 'block';
    stats1.style.display = 'none';
    stats2.style.display = 'none';

    $.ajax({
        url: `../../stock-info?ticker=${tickerSymbol}`,
        error: () => {
            loading1.style.display = 'none';
            loading2.style.display = 'none';
            stats1.style.display = 'block';
            stats2.style.display = 'block';

            opopenStat.innerHTML = '-';
            high.innerHTML = '-';
            low.innerHTML = '-';
            cap.innerHTML = '-';
            vol.innerHTML = '-';
            avgVol.innerHTML = '-';
            high52.innerHTML = '-';
            low52.innerHTML = '-';
        },
        success: (data) => {
            loading1.style.display = 'none';
            loading2.style.display = 'none';
            stats1.style.display = 'block';
            stats2.style.display = 'block';

            openStat.innerHTML = (data['open']);
            high.innerHTML = (data['high']);
            low.innerHTML = (data['low']);
            cap.innerHTML = numberWithCommas(data['marketCap']) || data['marketCap'];
            vol.innerHTML = numberWithCommas(data['vol']) || data['vol'];
            avgVol.innerHTML = numberWithCommas(data['avgVol']) || data['avgVol'];
            high52.innerHTML = (data['52wHigh']) || data['52wHigh'];
            low52.innerHTML = (data['52wLow']) || data['52wLow'];
        },
        type: 'GET'
    });
}

// Misc function to format numbers. Taken from the bible (https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript)
const numberWithCommas = (x) => {
    if (x == '-') {
        return null;
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Gets all sectors and populates dropdown menu.
const populateSectorDropDown = () => {
    $.ajax({
        url: `../../sector-list`,
        error: () => {
            console.warn("Error generating ticker list");
        },
        success: (data) => {
            //Populate sector dropdown
            let sectorSelect = document.getElementById('sector-select');

            let sectors = data['sectors'];
            sectors.forEach(sector => {
                var option = document.createElement("option");
                option.text = sector;
                option.value = sector;
                sectorSelect.appendChild(option);
            });
        },
        type: 'GET'
    });
}


const fetchStockNews = async (ticker) => {
    newsList.style.display = 'none';
    newsLoading.style.display = 'block';
    $.ajax({
        url: `../../stock-news?ticker=${ticker}`,
        error: () => {
            console.warn(`Error generating news for ${ticker}`);
        },
        success: (data) => {
            let all_article_html = "";
            data['articles'].forEach(article => {
                let header = "";

                let article_card = ` 
                <div class="card">
              
                    <div class="card-body">
                        <h5 class="card-title">${article['title']}</h5>
                        <a href="${article['link']}"  target="_blank" class="btn btn-primary">View article on ${article['source']['title']}</a>
                    </div>
                </div>`;

                all_article_html += article_card;
            });

            newsLoading.style.display = 'none';
            newsList.style.display = 'block';
            newsList.innerHTML = all_article_html;
        },
        type: 'GET'
    });
}

// Initiate random call automatically when page loads.
$(window).on('load', () => {
    populateSectorDropDown();
    $.ajax({
        url: `../../rand-nasdaq`,
        error: (data) => {
            console.warn(data);
            swal("Error generating ticker symbol");
        },
        success: (data) => {
            populateResultsSection(data, 'NASDAQ');
        },
        statusCode: {
            429: function (xhr) {
                swal(xhr.responseText);
            },
        },
        type: 'GET'
    });
})