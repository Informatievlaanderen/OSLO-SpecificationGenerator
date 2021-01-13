const jsonld = require('jsonld');
const pluralize = require('pluralize')

module.exports.mergeJsonAndContext = function (json, context) {
    return {
        "@context": context["@context"],
        "data": json["data"]
    }
}

module.exports.mergeDataAndContext = function (json, context) {
    return {
        "@context": context["@context"],
        "data": [json]
    }
}

module.exports.convertToResourceJsonld = function (mergedjson) {
    let jsonld = new Object()
    jsonld["@context"] = mergedjson["@context"]
    let dataarray = []
    for (let i = 0; i < mergedjson["data"].length; i++) {
        let dataobject = mergedjson["data"][i]
        let newdata = new Object()
        newdata["id"] = dataobject["id"]
        newdata["type"] = dataobject["type"]
        for (let [key, value] of Object.entries(dataobject["attributes"])) {
            newdata[key] = value
        }
        for (let [key, value] of Object.entries(dataobject["relationships"])) {
            let relationship = new Object
            relationship["self"] = dataobject["relationships"][key]["links"]["self"]
            newdata[key] = relationship
        }
        dataarray.push(newdata)
    }
    jsonld["data"] = dataarray
    return jsonld
}

module.exports.convertToResourceJsonldFullData = function (mergedjson, endpoint, port) {
    let jsonld = new Object()
    jsonld["@context"] = mergedjson["@context"]
    let dataarray = []
    for (let i = 0; i < mergedjson["data"].length; i++) {
        let dataobject = mergedjson["data"][i]
        let newdata = new Object()
        newdata["id"] = dataobject["id"]
        newdata["type"] = dataobject["type"]
        for (let [key, value] of Object.entries(dataobject["attributes"])) {
            newdata[key] = value
        }
        for (let [key, value] of Object.entries(dataobject["relationships"])) {
            let relationship = new Object
            relationship["self"] = endpoint + ":" + port + dataobject["relationships"][key]["links"]["self"]
            newdata[key] = relationship
        }
        dataarray.push(newdata)
    }
    jsonld["data"] = dataarray
    return jsonld
}

module.exports.jsonldToRdf = async function (input) {
    const nquads = await jsonld.toRDF(input, { format: 'application/n-quads' });
    console.log(nquads)
    return nquads
}

module.exports.rdfToJsonld = async function (input) {
    const doc = await jsonld.fromRDF(input, { format: 'application/n-quads' });
    console.log(JSON.stringify(doc))
    return doc
}

module.exports.createSimpleJsonldFrame = function (context) {
    return {
        "@context": context["@context"],
        "data": [{}]
    }
}

module.exports.frameJsonld = async function (input, frame) {
    const framed = await jsonld.frame(input, frame);
    let adjusted = new Object()
    adjusted["@context"] = framed["@context"]
    adjusted["data"] = framed["@graph"][0]["data"]
    console.log(JSON.stringify(adjusted))
    return adjusted
}

module.exports.framedJsonldToJsonApiResponse = function (input) {
    let workwith = input["data"]
    let jsonapi = new Object()
    dataarray = []
    let length = 1
    if (workwith.length !== undefined) { length = workwith.length }
    for (let i = 0; i < length; i++) {
        let newdata = new Object()
        let currdata = new Object()
        if (length > 1) { currdata = workwith[i] }
        else { currdata = workwith }
        for (let [key, value] of Object.entries(currdata)) {
            if (key == "id" || key == "type") {
                newdata[key] = value
            } else if (typeof value == 'object') {
                if (newdata["relationships"] === undefined) {
                    newdata["relationships"] = new Object()
                }
                newdata["relationships"][key] = new Object()
                newdata["relationships"][key]["links"] = value
            } else {
                if (newdata["attributes"] === undefined) {
                    newdata["attributes"] = new Object()
                }
                newdata["attributes"][key] = value
            }
        }
        dataarray.push(newdata)
    }
    jsonapi["data"] = dataarray
    return jsonapi
}

module.exports.framedJsonldToJsonApiBody = function (input) {
    let workwith = input["data"]
    let jsonapi = new Object()
    dataarray = []
    let length = 1
    if (workwith.length !== undefined) { length = workwith.length }
    for (let i = 0; i < length; i++) {
        let newdata = new Object()
        let currdata = new Object()
        if (length > 1) { currdata = workwith[i] }
        else { currdata = workwith }
        for (let [key, value] of Object.entries(currdata)) {
            if (key == "type") {
                newdata[key] = value
            } else if (key == "id") {
                continue;
            }
            else if (typeof value == 'object') {
                if (newdata["relationships"] === undefined) {
                    newdata["relationships"] = new Object()
                }
                newdata["relationships"][key] = new Object()
                newdata["relationships"][key]["data"] = new Object()
                newdata["relationships"][key]["data"]["id"] = "please enter the id of an existing object here, if you want to connect them. If not, remove the relationship object."
                let type = ""
                if (pluralize.isPlural(key)) { type = key }
                else { type = pluralize.plural(key) }
                newdata["relationships"][key]["data"]["type"] = type
            } else {
                if (newdata["attributes"] === undefined) {
                    newdata["attributes"] = new Object()
                }
                newdata["attributes"][key] = value
            }
        }
        dataarray.push(newdata)
    }
    jsonapi["data"] = dataarray
    return jsonapi
}