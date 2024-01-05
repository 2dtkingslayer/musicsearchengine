const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAYER = "https://api.spotify.com/v1/me/player";

const redirect_uri = "https://2dtkingslayer.github.io/musicsearchengine/"     // your value
// const redirect_uri = "http://127.0.0.1:5500/index.html"
const client_id = "7723844ff8c74907bd6d923db2d1cf9b"        // your value
const client_secret = "30480b1e5e8f45b1b1dd7323ebfb455e"    // your value

var accessToken = null;
var authorization_code = null;
var refresh_token = null;

function onPageLoad() {
    if (window.location.search.length > 0) handleRedirect();
    else {
        console.log("Don't handle redirect");
        accessToken = localStorage.getItem("access_token");
        console.log(accessToken);
        if (accessToken == null) {
            requestAuthorization();
        }
        else {
            refreshDevices();
        }
    }
}

function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse() {
    console.log(accessToken);
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if (data.access_token != undefined) {
            accessToken = data.access_token;
            localStorage.setItem("access_token", accessToken);
        }
        if (data.refresh_token  != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        // alert(this.responseText);
    }
}

function requestAuthorization() {
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); 

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function refreshDevices() {
    // callApi("GET", DEVICES, null, handleDevicesResponse);
    callApi("GET", PLAYER, null, handleDevicesResponse);
}

function handleDevicesResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
    }
    else if (this.status == 401) refreshAccessToken();
    else {
        console.log(this.responseText);
        // alert(this.responseText);
    }
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callApi(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.send(body);
    xhr.onload = callback;
}

$(document).ready(() => { // execute when ready
    $('#searchForm').on('submit', (e) => {
        let input = ($('#searchInput').val()); // get input from user and replace space with %20 for GET method
        input = replaceSpace(input);

        let search_type = ($('input[type=radio]:checked')); // which button is chosen
        var option = search_type.val();
        if (option === 'Name') {
            $(function () {
                $.ajax({
                    type: "GET",
                    url: "https://api.spotify.com/v1/search", // endpoint
                    data: {
                        q: input,  // search query
                        type: "track",
                    },
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                    success: function (data) {
                        displayTrackResult(data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log(jqXHR);
                        console.log(textStatus);
                        console.log(errorThrown);
                    }
                });
            })
        }
        else if (option === 'Artist'){
            $(function () {
                $.ajax({
                    type: "GET",
                    url: "https://api.spotify.com/v1/search",
                    data: {
                        q: input,  // search query
                        type: "artist",
                    },
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                    success: function (data) {
                        const top_artist = data.artists.items[0].name;
                        const top_artist_id = data.artists.items[0].id;
                        console.log(top_artist_id);
                        $.ajax({
                            type: "GET",
                            url: `https://api.spotify.com/v1/artists/${top_artist_id}/top-tracks`, // endpoint
                            data: {
                                market: "ES", // all
                            },
                            headers: {
                                Authorization: "Bearer " + accessToken,
                            },
                            success: function (data2) {
                                displayArtistResult(data2);
                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                console.log(jqXHR);
                                console.log(textStatus);
                                console.log(errorThrown);
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log(jqXHR);
                        console.log(textStatus);
                        console.log(errorThrown);
                    }
                });
            })
        }
        else if (option === 'Lyrics') {
            alert("Not yet supported by Spotify API. Will update soon.");
        }
        e.preventDefault();

    })
});

// display the result to the webpage using the retrieve data
function displayTrackResult(res) {
    let results = res.tracks.items;
    console.log(results);
    let output = 
    `<table class="table table-hover">
        <thead>
            <th scope="col">Songs</th>   
            <th scope="col">Artists</th>
            <th scope="col">Album</th>
            <th scope="col">Link</th>
        </thead>
    </table>`;
    // iterate the array and get outputs from it
    $.each(results, (index, info) => {
        const artistsNames = info.artists.map(artist => artist.name);
        const artistsString = artistsNames.join(', ');

        output += 
        `<table class="table table-hover">
            <tbody>
                <tr>
                    <th scope="row">${info.name}</th>
                    <td>${artistsString}</td>
                    <td>${info.album.name}</td>
                    <td><a href="${info.external_urls.spotify}" target="_blank"><button type="button" class="btn btn-primary">View Song</button></a></td>
                </tr>
            </tbody>
        </table>`;
    });
    $('#results').html(output);
}
function displayArtistResult(res) {
    console.log(res);
    let results = res.tracks;
    let output = 
    `<table class="table table-hover">
        <thead>
            <th scope="col">Songs</th>   
            <th scope="col">Artists</th>
            <th scope="col">Album</th>
            <th scope="col">Link</th>
        </thead>
    </table>`;
    // iterate the array and get outputs from it
    $.each(results, (index, info) => {
        const artistsNames = info.artists.map(artist => artist.name);
        const artistsString = artistsNames.join(', ');
        output += 
        `<table class="table table-hover">
            <tbody>
                <tr>
                    <th scope="row">${info.name}</th>
                    <td>${artistsString}</td>
                    <td>${info.album.name}</td>
                    <td><a href="${info.external_urls.spotify}" target="_blank"><button type="button" class="btn btn-primary">View Song</button></a></td>
                </tr>
            </tbody>
        </table>`;
    });
    $('#results').html(output);
}

// replace white space with %20 in a string
function replaceSpace(arr){
    for (var i = 0; i < arr.length; i++){
        if (arr[i] === ' ') arr[i] = '%20';
    }
    return arr;
}
