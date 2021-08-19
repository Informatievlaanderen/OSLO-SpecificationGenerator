build:
	docker build -f Dockerfile.circleci -t cls .

run: 
	docker run --rm -it --name clst -v $(CURDIR):/data cls bash

exec:
	node /app/shacl-generator2.js -i /data/test/all-OSLO-airAndWater-Core-ap.jsonld -o /data/test/shacl.jsonld -l en -m individual
	jq . /data/test/shacl.jsonld > /data/test/H.jsonld 
	


sync:
	sudo cp /data/shacl-generator2.js /app/shacl-generator2.js
	

publish:
	docker build -f Dockerfile.circleci -t informatievlaanderen/oslo-specification-generator:multilingual-dev .
	docker push informatievlaanderen/oslo-specification-generator:multilingual-dev

