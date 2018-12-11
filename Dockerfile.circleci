FROM circleci/node:10

#RUN useradd -m circleci
USER circleci

RUN sudo apt-get install vim

WORKDIR /app
ADD . /app
RUN sudo npm set unsafe-perm true
RUN sudo npm install
