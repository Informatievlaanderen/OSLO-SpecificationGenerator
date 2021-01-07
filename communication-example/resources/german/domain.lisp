(in-package :mu-cl-resources)
;; NOTE
;; docker-compose stop; docker-compose rm; docker-compose up
;; after altering this file.

(define-resource Adresse ()
   :class (s-url "http://www.w3.org/2002/07/owl#Class")
   :properties `((:strassenname :string ,(s-prefix "sh:street"))
                 (:hausnummer :string ,(s-prefix "sh:housenumber"))
                 (:anmerkungen :string ,(s-prefix "sh:extra")))
   :has-one `((Stadt :via ,(s-url "https://example.address.City")
                        :as "Staedte"))
:resource-base (s-url "https://example.address")
:on-path "Adressen")

(define-resource Stadt ()
   :class (s-url "http://www.w3.org/2002/07/owl#Class")
   :properties `((:land :string ,(s-prefix "sh:country"))
                 (:name :string ,(s-prefix "sh:name")))
   :has-many `((Adresse :via ,(s-url "https://example.address.City")
                        :inverse t
                        :as "Adressen"))
:resource-base (s-url "https://example.city")
:on-path "Staedte")

