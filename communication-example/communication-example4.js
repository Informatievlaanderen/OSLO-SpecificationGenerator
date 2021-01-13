var program = require('commander');
const http = require('http');
const jsonfile = require('jsonfile')
const converter = require('./ConvertToResourceJsonld');

program
    .version('0.0.1')
    .usage('node specgen-jsonld-merger.js merges translation Json with original jsonld')
    .option('-c, --city <String>', 'Name of the city/cities from which you want all addresses to be transferred')
    .option('-m, --mainport <port>', 'Port that the service the data should be transferred from runs on')
    .option('-g, --goalport <port>', 'Port that the service the data should be transferred to runs on')
    .option('-h, --mainhostname <String or url>', 'Hostname of the service the data should be transferred from')
    .option('-n, --goalhostname <String or url>', 'Hostname of the service the data should be transferred to')
    .option('-e, --englishcontext <jsonld>', 'File that contains the context of the English data (Jsonld)')
    .option('-d, --germancontext <jsonld>', 'File that contains the context of the German data (Jsonld)')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ specgen-shacl --help')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port>')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port> -n <hostname>')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port> -n <hostname> -h <hostname>')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port> -n <hostname> -h <hostname> -e <englishcontext jsonld> -d <germancontext jsonld>')
    process.exitCode = 1
})

program.parse(process.argv)
const mainport = program.mainport || '8888'
const goalport = program.goalport || '8888'
const mainhost = program.mainhostname || 'http://localhost:'
const goalhost = program.goalhostname || 'localhost'

const englishPath = program.englishcontext || "resources/english/englishcontext.jsonld"
const germanPath = program.germancontext || "resources/german/germancontext.jsonld"

var contextEn = new Object();
var contextDe = new Object();

/*
startProcess(program.city)

function startProcess(city) {
    jsonfile.readFile(englishPath)
        .then(
            function (english) {
                jsonfile.readFile(germanPath)
                    .then(
                        function (german) {
                            contextEn = english 
                            contextDe = german
                            transferAllAddresses(city)
                        })
                    .catch(error => { 
                        console.error(error); 
                        process.exitCode = 1
                    })
            })
        .catch(error => { 
            console.error(error); 
            process.exitCode = 1;
        })
}*/
contextEn = {
    "@context": {
        "data": "https://json.api/data",
        "attributes": "https://json.api/body/attributes",
        "relationships": "http://json.api/body/relationships",
        "self": "http://example.org/self",
        "id": "http://example.org",
        "type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "attributes": "http://example.org/body/attributes",
        "name": "http://www.w3.org/ns/shacl#name",
        "country": "http://www.w3.org/ns/shacl#country",
        "streetname": "http://www.w3.org/ns/shacl#streetname",
        "housenumber": "http://www.w3.org/ns/shacl#housenumber",
        "extra": "http://www.w3.org/ns/shacl#extra"
    }
};
contextDe = {
    "@context": {
        "data": "https://json.api/data",
        "attributes": "https://json.api/body/attributes",
        "relationships": "http://json.api/body/relationships",
        "self": "http://example.org/self",
        "id": "http://example.org",
        "type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "attributes": "http://example.org/body/attributes",
        "name": "http://www.w3.org/ns/shacl#name",
        "land": "http://www.w3.org/ns/shacl#country",
        "strassenname": "http://www.w3.org/ns/shacl#streetname",
        "hausnummer": "http://www.w3.org/ns/shacl#housenumber",
        "anmerkungen": "http://www.w3.org/ns/shacl#extra"
    }
};
transferAllAddresses("LA")
function transferAllAddresses(city) {
    http
        .get(mainhost + mainport + '/Cities?filter[name]=' + city, resp => {
            let data = ''

            resp.on('data', chunk => {
                data += chunk
            })
            resp.on('end', () => {
                let jsonData = JSON.parse(data)
                let city = jsonData["data"]
                console.log("city was retrieved: " + city)
                getAllAddressesInCity(city)
            })
        })
}

var addresses = new Object();
function getAllAddressesInCity(data) {
    for (let i = 0; i < data.length; i++) {
        var city = data[i]
        var id = city["id"]
        http
            .get(mainhost + mainport + '/Addresses?filter[City][id]=' + id, resp => {
                let data = ''
                resp.on('data', chunk => {
                    data += chunk
                })
                resp.on('end', () => {
                    let parsed = JSON.parse(data)
                    addresses = parsed["data"]
                    console.log("addresses were retrieved: " + addresses)
                    writeCityInOtherDatabase(city)
                })
            })
    }
}

function writeCityInOtherDatabase(city) {
    createData(city).then(
        function (body) {
            body["type"] = "Staedte"
            delete body["data"]["relationships"];
            const data = JSON.stringify({
                data: body["data"]
            })
            const options = {
                hostname: goalhost,
                port: goalport,
                path: '/Staedte',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/vnd.api+json'
                }
            }
            console.log("data to save city")
            console.log(data)

            const req = http.request(options, resp => {
                let data = ''

                resp.on('data', chunk => {
                    data += chunk
                })
                resp.on('end', () => {
                    let createdCity = JSON.parse(data)
                    writeAddressesInOtherDatabase(createdCity)
                })
            })

            req.on('error', error => {
                console.error(error)
            })

            req.write(data)
            req.end()
        })
        .catch(error => {
            console.error(error);
            process.exitCode = 1;
        })
}

function writeAddressesInOtherDatabase(city) {
    let id = city["data"]["id"]
    console.log("Creating addresses for city with id " + id)
    console.log("There are" + addresses.length + " to transfer.")
    for (let i = 0; i < addresses.length; i++) {
        let address = addresses[i]
        createData(address).then(
            function (body) {
                body["data"]["relationships"]["Stadt"] = { "data": { "type": "Staedte", "id": id } }
                const data = JSON.stringify({
                    data: body["data"]
                })
                const options = {
                    hostname: goalhost,
                    port: goalport,
                    path: '/Adressen',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/vnd.api+json'
                    }
                }
                console.log("data to save address")
                console.log(data)

                const req = http.request(options, resp => {
                    let data = ''

                    resp.on('data', chunk => {
                        data += chunk
                    })
                    resp.on('end', () => {
                        let createdAddress = JSON.parse(data)
                        console.log("Address created:")
                        console.log(createdAddress)
                    })
                })

                req.on('error', error => {
                    //console.error(error)
                })

                req.write(data)
                req.end()
            })
            .catch(error => {
                console.error(error);
                process.exitCode = 1;
            })
    }

}

async function createData(city) {
    console.log("Before transformation: ")
    console.log(JSON.stringify(city))
    const frame = converter.createSimpleJsonldFrame(contextDe)
    const merged = converter.mergeDataAndContext(city, contextEn)
    const jsonld = converter.convertToResourceJsonld(merged)
    converter.jsonldToRdf(jsonld).then(
        function (rdf) {
            converter.rdfToJsonld(rdf).then(
                function (neutraljsonld) {
                    converter.frameJsonld(neutraljsonld, frame).then(
                        function (framed) {
                            let body = converter.framedJsonldToJsonApiBody(framed);
                            return body;
                        })
                        .catch(error => {
                            console.error(error);
                            process.exitCode = 1;
                        })
                })
                .catch(error => {
                    console.error(error);
                    process.exitCode = 1;
                })
        })
        .catch(error => {
            console.error(error);
            process.exitCode = 1;
        })
}
