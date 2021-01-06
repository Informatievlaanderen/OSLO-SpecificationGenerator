(in-package :mu-cl-resources)
;; NOTE
;; docker-compose stop; docker-compose rm; docker-compose up
;; after altering this file.

;; Describe the prefixes which you'll use in the domain file here.
;; This is a short-form which allows you to write, for example,
;; (s-url "http://purl.org/dc/terms/title")
;; as (s-prefix "dct:title")
 (add-prefix "sh" "http://www.w3.org/ns/shacl#")
