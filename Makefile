build:
	docker build -f Dockerfile.circleci -t cls .

build-linux:
	docker build --platform=linux/amd64 -f Dockerfile.circleci -t cls .

run: 
	docker run --network host --rm -it --name clst -v $(CURDIR):/data cls bash

publish:
	docker build -f Dockerfile.circleci -t terraformtestcontainerregistry.azurecr.io/oslo2/oslo-specification-generator:multilingual-dev4.0.2 .
	docker push terraformtestcontainerregistry.azurecr.io/oslo2/oslo-specification-generator:multilingual-dev4.0.2


style:
	cd /app
	./node_modules/.bin/eslint --fix *.js 


ruby-build:
	docker build -f Dockerfile.ruby -t cruby .

ruby:
	docker run --rm -it --name crubyt -v $(CURDIR):/data cruby bash
