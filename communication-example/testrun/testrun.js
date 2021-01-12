const jsonfile = require('jsonfile')
const converter = require('../ConvertToResourceJsonld');
const jsonld = require('jsonld');

jsonfile.readFile("communication-example\\testrun\\examplecontext.jsonld")
    .then(
        function (context) {
            jsonfile.readFile("communication-example\\testrun\\jsonApiResult.json")
                .then(
                    function (json) {
                        let merged = converter.mergeJsonAndContext(json, context)
                        console.log(merged)
                        let jsonldinput = converter.convertToResourceJsonld(merged)
                        console.log(JSON.stringify(jsonldinput))
                        converter.jsonldToRdf(jsonldinput).then(
                            function (nquads) {
                                converter.rdfToJsonld(nquads).then(
                                    function (newjsonld) {
                                        let frame = converter.createSimpleJsonldFrame(context)
                                        console.log(JSON.stringify(frame))
                                        converter.frameJsonld(newjsonld, frame).then(
                                            function (framed) {
                                                let apirespones = converter.framedJsonldToJsonApiResponse(framed)
                                                console.log(JSON.stringify(apirespones))
                                                let apirbody = converter.framedJsonldToJsonApiBody(framed)
                                                console.log(JSON.stringify(apirbody))
                                            })
                                            .catch(error => {
                                                console.error(error);
                                                process.exitCode = 1
                                            })
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        process.exitCode = 1
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        process.exitCode = 1
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
        })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
