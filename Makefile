build:
	docker build -f Dockerfile.circleci -t cls .

build-linux:
	docker build --platform=linux/amd64 -f Dockerfile.circleci -t cls .

run: 
	docker run --network host --rm -it --name clst -v $(CURDIR):/data cls bash

publish:
	docker buildx build --platform=linux/amd64,linux/arm64 -f Dockerfile.circleci -t informatievlaanderen/oslo-specification-generator:multilingual-dev4.1.0 --push .


style:
	cd /app
	./node_modules/.bin/eslint --fix *.js 


ruby-build:
	docker build -f Dockerfile.ruby -t cruby .

ruby:
	docker run --rm -it --name crubyt -v $(CURDIR):/data cruby bash
