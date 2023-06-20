TESTDIR=/data/test

shacl:
	node /app/shacl-generator2.js -i /data/test/shacl-generator/1.input.jsonld -o /data/test/shacl-generator/1.output.jsonld.0 -l en -m grouped
	jq . /data/test/shacl-generator/1.output.jsonld.0 > /data/test/shacl-generator/1.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/1.input.jsonld -o /data/test/shacl-generator/2.output.jsonld.0 -l nl -m individual
	jq . /data/test/shacl-generator/2.output.jsonld.0 > /data/test/shacl-generator/2.output.jsonld
	# test for not generating a constraint in case maxCardinality has the value "n" 
	node /app/shacl-generator2.js -i /data/test/shacl-generator/3.input.jsonld -o /data/test/shacl-generator/3.output.jsonld.0 -l nl -m individual -d https://data.vlaanderen.be/shacl/DCAT-AP-VL
	jq -S . /data/test/shacl-generator/3.output.jsonld.0 > /data/test/shacl-generator/3.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/3.input.jsonld -o /data/test/shacl-generator/4.output.jsonld.0 -l nl -m individual -d https://data.vlaanderen.be/shacl/DCAT-AP-VL -c 'uniqueLanguages'
	jq -S . /data/test/shacl-generator/4.output.jsonld.0 > /data/test/shacl-generator/4.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/3.input.jsonld -o /data/test/shacl-generator/5.output.jsonld.0 -l nl -m individual -d https://data.vlaanderen.be/shacl/DCAT-AP-VL -c 'uniqueLanguages' -p https://data.vlaanderen.be/doc/applicatieprofiel/DCAT-AP-VL/ontwerpstandaard/2021-06-27
	jq -S . /data/test/shacl-generator/5.output.jsonld.0 > /data/test/shacl-generator/5.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/3.input.jsonld -o /data/test/shacl-generator/6.output.jsonld.0 -l nl -m individual -d https://data.vlaanderen.be/shacl/DCAT-AP-VL -c 'uniqueLanguages' -c 'nodekind'  -p https://data.vlaanderen.be/doc/applicatieprofiel/DCAT-AP-VL/erkendestandaard/2022-04-21
	jq -S . /data/test/shacl-generator/6.output.jsonld.0 > /data/test/shacl-generator/6.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/3.input.jsonld -o /data/test/shacl-generator/7.output.jsonld.0 -l nl -m individual -d https://data.vlaanderen.be/shacl/DCAT-AP-VL -c 'uniqueLanguages' -c 'nodekind'  -p https://data.vlaanderen.be/doc/applicatieprofiel/DCAT-AP-VL/erkendestandaard/2022-04-21 -a -b
	jq -S . /data/test/shacl-generator/7.output.jsonld.0 > /data/test/shacl-generator/7.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/8.input.jsonld -o /data/test/shacl-generator/8.output.jsonld.0 -l nl -m individual -d https://data.vlaanderen.be/shacl/metadata_dcat -c 'uniqueLanguages' -c 'nodekind'  -p https://data.vlaanderen.be/doc/applicatieprofiel/metadata-dcat/erkendestandaard/2021-04-22
	jq -S . /data/test/shacl-generator/8.output.jsonld.0 > /data/test/shacl-generator/8.output.jsonld
	node /app/shacl-generator2.js -i /data/test/shacl-generator/9.input.jsonld -o /data/test/shacl-generator/9.output.jsonld.0 -l en -m individual -d https://data.vlaanderen.be/shacl/GEODCAT-AP-VL -c 'uniqueLanguages' -c 'nodekind'  -p https://data.vlaanderen.be/doc/applicatieprofiel/GEODCAT-AP-VL/erkendestandaard/2022-01-23 -a 
	jq -S . /data/test/shacl-generator/9.output.jsonld.0 > /data/test/shacl-generator/9.output.jsonld


context: 
	node /app/json-ld-generator2.js -d -l label -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/1.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/1.output.jsonld.0 > /data/test/json-ld-generator/1.output.jsonld
	node /app/json-ld-generator2.js -l label -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/2.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/2.output.jsonld.0 > /data/test/json-ld-generator/2.output.jsonld
	node /app/json-ld-generator2.js -d -l uml -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/3.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/3.output.jsonld.0 > /data/test/json-ld-generator/3.output.jsonld
	node /app/json-ld-generator2.js -l uml -i /data/test/json-ld-generator/1.input.jsonld -o /data/test/json-ld-generator/4.output.jsonld.0 -m en
	jq -S . /data/test/json-ld-generator/4.output.jsonld.0 > /data/test/json-ld-generator/4.output.jsonld
	node /app/json-ld-generator2.js -l label -i /data/test/json-ld-generator/5.input.jsonld -o /data/test/json-ld-generator/5.output.jsonld.0 -m en -c
	jq -S . /data/test/json-ld-generator/5.output.jsonld.0 > /data/test/json-ld-generator/5.output.jsonld
	node /app/json-ld-generator2.js -d -l label -i /data/test/json-ld-generator/5.input.jsonld -o /data/test/json-ld-generator/6.output.jsonld.0 -m en -c
	jq -S . /data/test/json-ld-generator/6.output.jsonld.0 > /data/test/json-ld-generator/6.output.jsonld

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


MERGEDIR=${TESTDIR}/jsonld-merger
merge: 
	# addition
	node /app/jsonld-merger.js -i ${MERGEDIR}/1.input.jsonld -m ${MERGEDIR}/1.translation.nl.json -l en -o ${MERGEDIR}/1.merged.jsonld.0
	jq -S . ${MERGEDIR}/1.merged.jsonld.0 > ${MERGEDIR}/1.merged.jsonld
	# NO-OP
	node /app/jsonld-merger.js -i ${MERGEDIR}/1.input.jsonld -m ${MERGEDIR}/1.translation.en.json -l en -o ${MERGEDIR}/2.merged.jsonld.0
	jq -S . ${MERGEDIR}/2.merged.jsonld.0 > ${MERGEDIR}/2.merged.jsonld


TRANSLATEDIR=${TESTDIR}/translation-json-generator
translate:
	echo " > translation generation"
	node /app/translation-json-generator.js -i ${TRANSLATEDIR}/1.input.jsonld -m en -g nl -o ${TRANSLATEDIR}/1.translation.nl.json.0
	jq -S . ${TRANSLATEDIR}/1.translation.nl.json.0 > ${TRANSLATEDIR}/1.translation.nl.json
	node /app/translation-json-generator.js -i ${TRANSLATEDIR}/1.input.jsonld -m en -g en -o ${TRANSLATEDIR}/1.translation.en.json.0
	jq -S . ${TRANSLATEDIR}/1.translation.en.json.0 > ${TRANSLATEDIR}/1.translation.en.json
	node /app/translation-json-generator.js -i ${TRANSLATEDIR}/1.input.jsonld -m en -g de -o ${TRANSLATEDIR}/1.translation.de.json.0
	jq -S . ${TRANSLATEDIR}/1.translation.de.json.0 > ${TRANSLATEDIR}/1.translation.de.json
	echo " > translation updating"
	node /app/translation-json-update.js -i ${TRANSLATEDIR}/2.translation.nl.json -f ${TRANSLATEDIR}/2.input.jsonld -m en -g nl -o ${TRANSLATEDIR}/2.output.nl.json.0
	jq -S . ${TRANSLATEDIR}/2.output.nl.json.0 > ${TRANSLATEDIR}/2.output.nl.json
	node /app/translation-json-update.js -i ${TRANSLATEDIR}/2.translation.nl.json -f ${TRANSLATEDIR}/3.input.jsonld -m en -g nl -o ${TRANSLATEDIR}/3.output.nl.json.0
	jq -S . ${TRANSLATEDIR}/3.output.nl.json.0 > ${TRANSLATEDIR}/3.output.nl.json
	echo " > translation report" 
	node /app/generate-translation-report.js -i ${TRANSLATEDIR}/1.translation.nl.json -l nl -o ${TRANSLATEDIR}/1.report.nl.txt
	node /app/generate-translation-report.js -i ${TRANSLATEDIR}/1.translation.en.json -l en -o ${TRANSLATEDIR}/1.report.en.txt
	node /app/generate-translation-report.js -i ${TRANSLATEDIR}/1.translation.de.json -l de -o ${TRANSLATEDIR}/1.report.de.txt


MUCONFIGDIR=${TESTDIR}/mu-config-generator
mu-config:
	node /app/mu-config-generator.js -i ${MUCONFIGDIR}/1.input.jsonld -l en -o ${MUCONFIGDIR}


HTMLDIR=${TESTDIR}/html-generator
html:
	cp ../views/*.j2 ${HTMLDIR}/templates
	node /app/html-generator2.js -s ap -t 1.template.j2 -d ${HTMLDIR}/templates -f -h https://data.vlaanderen.be/ -r /doc/vocabulary -x ${HTMLDIR}/1.html-nj.json.0  -m en -e /tmp -i ${HTMLDIR}/1.input.jsonld -o ${HTMLDIR}/1.output.html
	jq -S . ${HTMLDIR}/1.html-nj.json.0 > ${HTMLDIR}/1.html-nj.json

PRETTYPRINTDIR=${TESTDIR}/pretty-print
prettyprint:
	node /app/pretty-print.js -i ${PRETTYPRINTDIR}/1.input.jsonld -o ${PRETTYPRINTDIR}/1.output.jsonld.0
	jq . ${PRETTYPRINTDIR}/1.output.jsonld.0 > ${PRETTYPRINTDIR}/1.output.jsonld
	node /app/pretty-print.js --descending -i ${PRETTYPRINTDIR}/1.input.jsonld -o ${PRETTYPRINTDIR}/2.output.jsonld.0
	jq . ${PRETTYPRINTDIR}/2.output.jsonld.0 > ${PRETTYPRINTDIR}/2.output.jsonld
	node /app/pretty-print.js -i ${PRETTYPRINTDIR}/1.input.jsonld -o ${PRETTYPRINTDIR}/3.output.jsonld.0 
	jq . ${PRETTYPRINTDIR}/3.output.jsonld.0 > ${PRETTYPRINTDIR}/3.output.jsonld
	node /app/pretty-print.js -i ${PRETTYPRINTDIR}/1.input.jsonld -o ${PRETTYPRINTDIR}/4.output.jsonld.0 --sortAttributes 'foaf:FirstName'
	jq . ${PRETTYPRINTDIR}/4.output.jsonld.0 > ${PRETTYPRINTDIR}/4.output.jsonld
	node /app/pretty-print.js -i ${PRETTYPRINTDIR}/1.input.jsonld -o ${PRETTYPRINTDIR}/5.output.jsonld.0 --sortkeys 'editors' --sortAttributes 'asc:foaf:firstName'
	jq . ${PRETTYPRINTDIR}/5.output.jsonld.0 > ${PRETTYPRINTDIR}/5.output.jsonld
	node /app/pretty-print.js -i ${PRETTYPRINTDIR}/1.input.jsonld -o ${PRETTYPRINTDIR}/6.output.jsonld.0 --sortkeys 'editors' --sortAttributes 'desc:foaf:firstName'
	jq . ${PRETTYPRINTDIR}/6.output.jsonld.0 > ${PRETTYPRINTDIR}/6.output.jsonld
	node /app/pretty-print.js -i ${PRETTYPRINTDIR}/2.input.jsonld -o ${PRETTYPRINTDIR}/7.output.jsonld.0 -s properties externalproperties -a '@id' 'name' 'definition'
	jq . ${PRETTYPRINTDIR}/7.output.jsonld.0 > ${PRETTYPRINTDIR}/7.output.jsonld

RUBYDIR=${TESTDIR}/shacl-generator
ruby:
	rdf serialize --input-format jsonld --processingMode json-ld-1.1 ${RUBYDIR}/assocafdalen-SHACL.jsonld --output-format turtle -o ${RUBYDIR}/assocafdalen-SHACL.ttl
	rdf serialize --input-format jsonld --processingMode json-ld-1.1 --ordered --canonicalize -d --verbose --unique-bnodes ${RUBYDIR}/assocafdalen-SHACL.jsonld --output-format turtle -o ${RUBYDIR}/assocafdalen-SHACL.ttl.2
	rdf serialize --input-format jsonld --processingMode json-ld-1.1 --ordered --canonicalize --unique-bnodes ${RUBYDIR}/assocafdalen-SHACL.jsonld --output-format turtle -o ${RUBYDIR}/assocafdalen-SHACL.ttl.3

RUBYVOCDIR=${TESTDIR}/render-voc
rubyvoc:
	rdf serialize --input-format jsonld --processingMode json-ld-1.1 ${RUBYVOCDIR}/1.output.jsonld --output-format turtle -o ${RUBYVOCDIR}/1.output.ttl


XMLDIR=${TESTDIR}/xml-generator
xml: 
	node /app/new-xsd-generator.js -d -l label -i ${XMLDIR}/1.input.jsonld -o ${XMLDIR}/1.output.xsd -m en -b https://data.europa.eu/m8g/xml/
	node /app/new-xsd-generator.js -d -l label -i ${XMLDIR}/2.input.jsonld -o ${XMLDIR}/2.output.xsd -m en -b https://data.europa.eu/m8g/xml/
	node /app/new-xsd-generator.js -d -l label -i ${XMLDIR}/3.input.jsonld -o ${XMLDIR}/3.output.xsd -m en -b https://data.europa.eu/m8g/xml/
