build:
	docker build -f Dockerfile.circleci -t cls .

run: 
	docker run --rm -it --name clst -v $(CURDIR):/data cls bash

publish:
	docker build -f Dockerfile.circleci -t informatievlaanderen/oslo-specification-generator:multilingual-dev-0.5 .
	docker push informatievlaanderen/oslo-specification-generator:multilingual-dev-0.5


style:
	cd /app
	./node_modules/.bin/eslint *.js


ruby-build:
	docker build -f Dockerfile.ruby -t cruby .

ruby:
	docker run --rm -it --name crubyt -v $(CURDIR):/data cruby bash
