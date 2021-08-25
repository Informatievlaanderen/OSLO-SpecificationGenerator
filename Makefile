build:
	docker build -f Dockerfile.circleci -t cls .

run: 
	docker run --rm -it --name clst -v $(CURDIR):/data cls bash

publish:
	docker build -f Dockerfile.circleci -t informatievlaanderen/oslo-specification-generator:multilingual-dev .
	docker push informatievlaanderen/oslo-specification-generator:multilingual-dev


style:
	cd /app
	./node_modules/.bin/eslint *.js
