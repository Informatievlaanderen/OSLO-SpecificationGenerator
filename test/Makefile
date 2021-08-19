TESTDIR=/data/test

shacl:
	node /app/shacl-generator2.js -i /data/test/shacl-generator/1.input.jsonld -o /data/test/shacl-generator/1.output.jsonld.0 -l en -m grouped
	jq . /data/test/shacl-generator/1.output.jsonld.0 > /data/test/shacl-generator/1.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/1.input.jsonld -o /data/test/shacl-generator/2.output.jsonld.0 -l en -m individual
	jq . /data/test/shacl-generator/2.output.jsonld.0 > /data/test/shacl-generator/2.output.jsonld

context: 
	node /app/json-ld-generator2.js -d -l label -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/1.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/1.output.jsonld.0 > /data/test/json-ld-generator/1.output.jsonld
	node /app/json-ld-generator2.js -l label -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/2.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/2.output.jsonld.0 > /data/test/json-ld-generator/2.output.jsonld
	node /app/json-ld-generator2.js -d -l uml -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/3.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/3.output.jsonld.0 > /data/test/json-ld-generator/3.output.jsonld
	node /app/json-ld-generator2.js -l uml -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/4.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/4.output.jsonld.0 > /data/test/json-ld-generator/4.output.jsonld

vocabulary:
	node /app/render-voc.js -i ${TESTDIR}/render-voc/1.input.jsonld -o ${TESTDIR}/render-voc/1.output.jsonld.0 -l en
	jq -S . ${TESTDIR}/render-voc/1.output.jsonld.0 > ${TESTDIR}/render-voc/1.output.jsonld
	node /app/render-voc.js -i ${TESTDIR}/render-voc/2.input.jsonld -o ${TESTDIR}/render-voc/2.output.jsonld.0 -l nl
	jq -S . ${TESTDIR}/render-voc/2.output.jsonld.0 > ${TESTDIR}/render-voc/2.output.jsonld

EXAMPLEDIR=${TESTDIR}/exampletemplate-generator
example:
	mkdir -p ${EXAMPLEDIR}/1
	mkdir -p ${EXAMPLEDIR}/1/context
	chmod 777 ${EXAMPLEDIR}/1
	chmod 777 ${EXAMPLEDIR}/1/context
	node /app/exampletemplate-generator2.js -i ${TESTDIR}/exampletemplate-generator/1.input.jsonld  -o ${TESTDIR}/exampletemplate-generator/1 -l en -h https://data.vlaanderen.be/examples
	mkdir -p ${EXAMPLEDIR}/2
	mkdir -p ${EXAMPLEDIR}/2/context
	chmod 777 ${EXAMPLEDIR}/2
	chmod 777 ${EXAMPLEDIR}/2/context
	node /app/exampletemplate-generator2.js -i ${TESTDIR}/exampletemplate-generator/2.input.jsonld  -o ${TESTDIR}/exampletemplate-generator/2 -l nl -h https://data.vlaanderen.be/examples -x ${TESTDIR}/exampletemplate-generator/2.internal.json.0
	jq -S . ${TESTDIR}/exampletemplate-generator/2.internal.json.0 > ${TESTDIR}/exampletemplate-generator/2.internal.json
