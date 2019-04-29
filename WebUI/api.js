var apiurl = "http://localhost:8000/";

function get(path, query) {
    var p = "";
    if (query) {
        var params = new URLSearchParams();
        for (z in query) {
            params.set(z, query[z]);
        }
        p = p + "?" + params.toString();
    }
    return fetch(apiurl + path + p, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        mode: "cors"
    }).then(response => response.json())
}

function put(path, query) {
    return fetch(apiurl + path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(query),
        mode: "cors",

    }).then(response => response.json())
}

function post(path, query) {
    return fetch(apiurl + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(query),
        mode: "cors"

    }).then(response => response.json())
}

function state(name){
    return get('state', {name:name});
}

function grow(name, position, source){
    return put('grow', {name:name, postion:position, source:source});
}

function setupPut(name, position){
    return put('setupput', {name:name, position:position});
}