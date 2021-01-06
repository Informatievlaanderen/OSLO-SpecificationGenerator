var program = require('commander');
const http = require('http');

program
    .version('0.0.1')
    .usage('node specgen-jsonld-merger.js merges translation Json with original jsonld')
    .option('-c, --city <String>', 'Name of the city/cities from which you want all addresses to be transferred')
    .option('-m, --mainport <port>', 'Port that the service the data should be transferred from runs on')
    .option('-g, --goalport <port>', 'Port that the service the data should be transferred to runs on')
    .option('-h, --mainhostname <String or url>', 'Hostname of the service the data should be transferred from')
    .option('-n, --goalhostname <String or url>', 'Hostname of the service the data should be transferred to')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ specgen-shacl --help')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port>')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port> -n <hostname>')
    console.log('  $ specgen-shacl -c <cityname> -m <port> -g <port> -n <hostname> -h <hostname>')
    process.exitCode = 1
})

program.parse(process.argv)
const mainport = program.mainport
const goalport = program.goalport
const mainhost = program.mainhostname || 'http://localhost:'
const goalhost = program.goalhostname || 'localhost'

transferAllAddresses(program.city)

function transferAllAddresses(city) {
    http
        .get(mainhost + mainport + '/Cities?filter[name]=' + city, resp => {
            let data = ''

            resp.on('data', chunk => {
                data += chunk
            })
            resp.on('end', () => {
                let jsonData = JSON.parse(data)
                console.log("city was retrieved")
                getAllAddressesInCity(jsonData["data"])
            })
        })
}

var addresses = {};
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
                    addresses = JSON.parse(data)
                    console.log(addresses["data"])
                    writeAllInOtherDatabase(city)
                })
            })
    }
}

function writeAllInOtherDatabase(city) {
    const data = JSON.stringify({
        data: {
            "type": "Staedte",
            "attributes": {
                "name": city["attributes"]["name"],
                "land": city["attributes"]["country"]
            }
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

    const req = http.request(options, resp => {
        let data = ''

        resp.on('data', chunk => {
            data += chunk
        })
        resp.on('end', () => {
            let createdCity = JSON.parse(data)
            console.log("City was created: " + createdCity)
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
    for (let i = 0; i < addresses.length; i++) {
        let address = addresses[i]
        const data = JSON.stringify({
            data: {
                "type": "Addressen",
                "attributes": {
                    "strassenname": address["attributes"]["streetname"],
                    "hausnummer": address["attributes"]["housenumber"],
                    "anmerkungen": address["attributes"]["extra"]
                },
                "relationships": {
                    "Stadt": {
                        "data": {
                            "type": "Stadt",
                            "id": id
                        }
                    }
                }
            }
        })
        const options = {
            hostname: goalhost,
            port: goalport,
            path: '/Addressen',
            method: 'POST',
            headers: {
                'Content-Type': 'application/vnd.api+json'
            }
        }

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