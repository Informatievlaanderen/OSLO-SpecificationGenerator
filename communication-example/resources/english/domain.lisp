(in-package :mu-cl-resources)
;; NOTE
;; docker-compose stop; docker-compose rm; docker-compose up
;; after altering this file.

(define-resource Address ()
   :class (s-url "http://www.w3.org/2002/07/owl#Class")
   :properties `((:streetname :string ,(s-prefix "sh:street"))
                 (:housenumber :string ,(s-prefix "sh:housenumber"))
                 (:extra :string ,(s-prefix "sh:extra")))
   :has-one `((City :via ,(s-url "https://example.address.City")
                        :as "City"))
:resource-base (s-url "https://example.address")
:on-path "Addresses")

(define-resource City ()
   :class (s-url "http://www.w3.org/2002/07/owl#Class")
   :properties `((:country :string ,(s-prefix "sh:country"))
                 (:name :string ,(s-prefix "sh:name")))
   :has-many `((Address :via ,(s-url "https://example.address.City")
                        :inverse t
                        :as "Addresses"))
:resource-base (s-url "https://example.city")
:on-path "Cities")

