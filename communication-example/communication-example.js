const fs = require('fs')
const jsonfile = require('jsonfile')
var pluralize = require('pluralize')
const StringBuilder = require("string-builder");
var program = require('commander');
const https = require('https');
const http = require('http');

program
    .version('0.0.1')
    .usage('node specgen-jsonld-merger.js merges translation Json with original jsonld')
    .option('-c, --city <>', '')
    .option('-m, --mainport <>', '')
    .option('-g, --goalport <>', '')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ specgen-shacl --help')
    console.log('  $ specgen-shacl -i <input> -o <output> -l <language>')
    console.log('  $ specgen-shacl -i <input> -o <output> -l <language> -s <boolean>')
    process.exitCode = 1
})

program.parse(process.argv)
const mainport = program.mainport
const goalport = program.goalport
transferAllAddresses(program.city)
//http://localhost:8888/Addresses?filter[City][name]=London
//http://localhost:8888/Cities?filter[name]=London
function transferAllAddresses(city) {
    http
        .get('http://localhost:'+mainport+'/Cities?filter[name]='+city, resp => {
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
            .get('http://localhost:'+mainport+'/Addresses?filter[City][id]=' + id, resp => {
                let data = ''
                let datachunk = ''
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

function writeAllInOtherDatabase(city, addresses) {
    const data = JSON.stringify({
        data: {
            "type": "Cities",
            "attributes": {
                "name": city["attributes"]["name"],
                "country": city["attributes"]["country"]
            }
        }
    })

    const options = {
        hostname: 'localhost',
        port: goalport,
        path: '/Cities',
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
            console.log("City was created: "+createdCity)
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
                "type": "Addresses",
                "attributes": address["attributes"],
                "relationships": {
                    "City": {
                        "data": {
                            "type": "Cities",
                            "id": id
                        }
                    }
                }
            }
        })

        const options = {
            hostname: 'localhost',
            port: goalport,
            path: '/Addresses',
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

console.log('done')

