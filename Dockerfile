FROM python:3-alpine as builder

ENTRYPOINT ["python", "/app/specgen/generate_vocabulary.py"]
CMD ["--help"]
VOLUME /data

WORKDIR /app
RUN apk add --update build-base libxml2-dev libxslt-dev
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY templates/ /app/templates
COPY specgen/ /app/specgen

