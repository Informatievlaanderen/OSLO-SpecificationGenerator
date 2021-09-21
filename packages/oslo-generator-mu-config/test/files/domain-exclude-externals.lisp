(in-package :mu-cl-resources)
;; NOTE
;; docker-compose stop; docker-compose rm; docker-compose up
;; after altering this file.

(define-resource Bag ()
   :class (s-url "https://data.ai-proficiant.eu/ns#Bag")
:resource-base (s-url "https://data.ai-proficiant.eu/ns#Bag")
:on-path "Bags")
