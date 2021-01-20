var program = require('commander');
const http = require('http');
const jsonfile = require('jsonfile')

program
    .version('0.0.1')
    .usage('node communication-example3.js merges translation Json with original jsonld')
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
    console.log('  $ communication-example3 --help')
    console.log('  $ communication-example3 -c <cityname> -m <port> -g <port>')
    console.log('  $ communication-example3 -c <cityname> -m <port> -g <port> -n <hostname>')
    console.log('  $ communication-example3 -c <cityname> -m <port> -g <port> -n <hostname> -h <hostname>')
    console.log('  $ communication-example3 -c <cityname> -m <port> -g <port> -n <hostname> -h <hostname> -e <englishcontext jsonld> -d <germancontext jsonld>')
    process.exitCode = 1
})

program.parse(process.argv)
const mainport = program.mainport
const goalport = program.goalport
const mainhost = program.mainhostname || 'http://localhost:'
const goalhost = program.goalhostname || 'localhost'

const englishPath = program.englishcontext || "resources/english/englishcontext.jsonld"
const germanPath = program.germancontext || "resources/german/germancontext.jsonld"

const contextEnToGer = new Object();

startProcess(program.city)

function startProcess(city) {
    jsonfile.readFile(englishPath)
        .then(
            function (english) {
                jsonfile.readFile(germanPath)
                    .then(
                        function (german) {
                            createDictionary(english["@context"], german["@context"]).then(
                                function () {
                                    transferAllAddresses(city)
                                })
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
}

async function createDictionary(english, german) {
    for (let [englishKey, englishValue] of Object.entries(english)) {
        for (let [germanKey, germanValue] of Object.entries(german)) {
            if (englishValue == germanValue) {
                contextEnToGer[englishKey] = germanKey
            }
        }
    }
}

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
                    writeAllInOtherDatabase(city)
                })
            })
    }
}

function writeAllInOtherDatabase(city) {
    const data = JSON.stringify({
        data: {
            "type": "Staedte",
            "attributes": getAttributesFromObject(city["attributes"])
        }
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
            console.log(createdCity)
            writeAddressesInOtherDatabase(createdCity)
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.write(data)
    req.end()
}

function writeAddressesInOtherDatabase(city) {
    let id = city["data"]["id"]
    console.log("Creating addresses for city with id " + id)
    console.log("There are" + addresses.length + " to transfer.")
    for (let i = 0; i < addresses.length; i++) {
        let address = addresses[i]
        const data = JSON.stringify({
            data: {
                "type": "Adressen",
                "attributes": getAttributesFromObject(address["attributes"]),
                "relationships": {
                    "Stadt": {
                        "data": {
                            "type": "Staedte",
                            "id": id
                        }
                    }
                }
            }
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
            console.error(error)
        })

        req.write(data)
        req.end()
    }
}

function getAttributesFromObject(object) {
    let attributes = new Object()
    for (let [key, value] of Object.entries(object)) {
        attributes[contextEnToGer[key]] = value
    }
    return attributes
}
