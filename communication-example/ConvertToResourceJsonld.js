const jsonld = require('jsonld');

module.exports.mergeJsonAndContext = function (json, context) {
    return {
        "@context": context["@context"],
        "data": json["data"]
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
            newdata[key] = new Object
            let relationship = new Object
            relationship["id"] = dataobject["relationships"][key]["links"]["self"].split("/")[2]
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