TODO: 
* Make hostname as input (curr hardcoded localhost)  


Workflow:  
Example works for structure: Cities(attribute: name, country) that point to multiple Addresses and an Address (attributes: streetname, housenumber, extra) in relation to only one city. Mocked these triples exist:  
Addressobject <relationship:hasCity> Cityobject .

- Two given mu-projects exist.  
- Setup:
    - Project A has the objects:  
        - City;  
            name: "London", country: "England"  
        - Address;  
            streetname: "Baker Street", housenumber: "221b"  
            streetmame: "London Street", housenumber: "5A", extra: "first floor left"  
    - Project B knows the structure (both have same elements in domain.lisp and repository.lisp)  
- Tool:
- Input: Cityname - in example case London - (transfer all cities with the name and the addresses to go with it), ports of A and B
- Tool will first read the city and then all addresses that are connected to it (via get requests)
- Objects will be given to another function that calls post requests
    1. An object for the city will be created on the db having the same attributes as London  
        1.1 the Id of that object is saved
    2. For each address and object is created on the db having the same attributes. Under the relationship key there will be a value for Cities, pointing to the saved id. 
- Triples are now transfered from A to B

Why will this not work for other resource structures?  
- each object has it's own path to send the requests to
- each object needs a different body for the post calls
- each object needs a different filter (in url) for the get calls
- means: adding for example a country object need two additional functions in code