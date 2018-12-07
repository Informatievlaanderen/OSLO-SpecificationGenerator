FROM node:8.9.0

ADD . /app

WORKDIR /app

# The next 3 commands are commented out. This is because not all Jinja2 templates are
# nunjucks compliant. we first need to make sure that those templates comply. Otherwise
# generating the HTML files will fail.
#
# RUN git clone https://github.com/Informatievlaanderen/Data.Vlaanderen.be.git -b test /tmp/data_vlaanderen_be
# RUN rm -rf views
# RUN mv /tmp/data_vlaanderen_be/templates /app/views

RUN npm install
