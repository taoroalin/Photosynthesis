function apiFactory(){
    var api={};

    api.url = "http://localhost:8000/";

    api.get = function(path, query) {
        var p = "";
        if (query) {
            var params = new URLSearchParams();
            for (z in query) {
                params.set(z, query[z]);
            }
            p = p + "?" + params.toString();
        }
        return fetch(this.url + path + p, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            mode: "cors"
        }).then(response => response.json())
    }
    
    api.put = function(path, query) {
        return fetch(this.url + path, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(query),
            mode: "cors",
    
        }).then(response => response.json())
    }
    
    api.post = function(path, query) {
        return fetch(this.url + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(query),
            mode: "cors"
    
        }).then(response => response.json())
    }
    
    api.state = function(name){
        return this.get('state', {name:name});
    }
    
    api.grow = function(name, position, source){
        return this.put('grow', {name:name, postion:position, source:source});
    }
    
    api.setupPut = function(name, position){
        return this.put('setupput', {name:name, position:position});
    }
    return api;
}