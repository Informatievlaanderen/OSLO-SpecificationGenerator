# README
## Data Structure
This example was written to show the possibility of having two mu-semtech projects communicate with each other by transferring the data from one to another. This example is setup for a simple structure of Cities and Addresses, as seen in this:
![Diagram](http://www.plantuml.com/plantuml/png/JSv12W8n30NGVK_HfIxc0Yvan2DuWZZzE8Lf2aag5l7kbj7gx4BoyfDHZSHAMjoqaAe_Hwl-wIucaM-UAQ7NKoviKjthAqyX25J_M4q0swxCkIYuf2kaj_0mePQntXcElvI3dqc7H5pzBl8TejYxFcnkzH-K6Mu4X_Rq6m00)  
This means a possible example triple would be: 
Addressobject <relationship:hasCity> Cityobject .  
The example code will now transfer all data of a given cityname and it's respective addresses. If you give the name "Berlin", it will transfer all Berlins in your database A to B with the addresses that are connected to the cities still pointing to them, too. It is to be mentioned, that the Ids of the, in theory, similar objects in project A and B do not allign as those cannot be changed when adding new values to an endpoint.

## The Setup
To recreate this example, you need to have the following setup:  
- Two given mu-projects (in the following A and B) exist with the resource-structure you can find in the [english folder](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example/resources/english) of the [resource directory](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example/resources).  
- Content of the databases:
    - The following is only an example setup and can be adjusted in terms of values and still work if the general structure remains.
    - Project A has the objects:  
        - /Cities  
            name: "London", country: "England"  
        - /Addresses  
            streetname: "Baker Street", housenumber: "221b" with a relationship to the city London that was just created   
            streetname: "London Street", housenumber: "5A", extra: "first floor left" with a relationship to the city London that was just created   
    - As B knows the resource structure but does not have these objects. (It will also work if both have the same objects but that will simply cause a duplication) 
To create these objects you will need to make the following post-requests:  
For all of them you need to define the header `"Content-Type": "application/vnd.api+json"`.
First to the /Cities endpoint with the body:  
`{  `  
`    data: {  `   
`            "type": "Cities",  `  
`            "attributes": {  `  
`                "name": "London",  `   
`                "country": "England"  `  
`            }  `  
`        }  `  
`    }  `  
You will then get the created object returned and need to remember the Id of said object.
Now to the /Addresses endpoint with the body:
`{  
    data: {  
                "type": "Addresses",  
                "attributes": {  
                    "streetname": "Baker Street",  
                    "housenumber": "221b"  
                },  
                "relationships": {    
                    "City": {  
                        "data": {  
                            "type": "Cities",  
                            "id": {{the Id you got from creating London}}  
                        }  
                    }  
                }  
            }    
}`   
and another one with:   
`{  
    data: {  
                "type": "Addresses",  
                "attributes": {  
                    "streetname": "London Street",  
                    "housenumber": "5A",   
                    "extra": "first floor left"  
                },  
                "relationships": {  
                    "City": {  
                        "data": {  
                            "type": "Cities",  
                            "id": {{the Id you got from creating London}}  
                        }  
                    }  
                }  
            }   
}`   
You can add as many additional objects in this structure as you please.  

## The Tool - Version 1
`communication-example1.js`  
In our example we use the cityname "London" and give the ports our services run on. If the default hostnames 'localhost' do not fit, they need to be given, too. The tool will then extract all London-named cities from A, create new Cities with the same attributes in B. It will also then extract all the addresses pointing to the London from A it is currently looking at and create new addresses with the same attributes in B, pointing to the respective city in B.  
Our example will now cause this workflow:  
- Run: `.\\node communication-example.js -c London -m 8888 -g 8889` but change the values to fit yours  
- The tool will now retrieve the object London from A via a get request  
- Using Lonon's Id the tool will now retrieve the address objects (Baker Street, London Street) that have a relationship to it from A via a get request  
- The objects will be now transferred to B using one post requests for each object  
    1. An object for the city will be created on B having the same attributes as the London object  
        1.1 The Id of that object is saved  
    2. For each address a new object is created on B having the same attributes. Under the relationship key there will be a value for Cities, pointing to the saved Id.  
If you would now use the same get request as in the first steps on B, you will receive the transferred objects.  

## The Tool - Version 2
`communication-example2.js`  
### Adjusted Setup
For this version, project A is prepared as described [before](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example#the-setup). However, for B we use a different resource structure that can be found in the [German folder](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example/resources/german) of the [resource directory](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example/resources). This is the same structure as for B but in German.
### Workflow
This tool is used to show an example communication between two Apis of different languages. This causes the labels to differ, while the resource uris are still the same. So for example the attributes "Country" and "Land" (German for country) both are described via `sh:country` - they differ in name but describe the same resource. This tool now has a static coded translation between the two (from English attributes to German attributes) but otherwise behaves the same. There is no translation of the values happening. We still need to have the paths in code as they are not given in context and therefore cannot be properly translated.

## The Tool - Version 3
`communication-example3.js`  
### Adjusted Setup
For this version, project A is prepared as described [before](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example#the-setup). However, for B we use a different resource structure that can be found in the [German folder](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example/resources/german) of the [resource directory](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example/resources). This is the same structure as for B but in German.
### Workflow
This tool is used to show an example communication between two Apis of different languages. This causes the labels to differ, while the resource uris are still the same. So for example the attributes "Country" and "Land" (German for country) both are described via `sh:country` - they differ in name but describe the same resource. This tool now uses the context jsonld files of the two to translate the values between the two (from English attributes to German attributes) but otherwise behaves the same. The mapping of the English labels to the German labels happens by comparing the two based on the uris in the context file. There is no translation of the values happening. We still need to have the paths in code as they are not given in context and therefore cannot be properly translated.

### Why will this not work for other resource structures?   
- each object has needs its own path to send the requests to (for example for City objects, we need the path /Cities)  
- each object needs a different body for the post calls (as you can see in the [Setup section](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/multilingual/communication-example#the-setup))  
- each object needs a different filter (in url) for the get calls (for example to retrieve the addresses that go with a city we add the string '?filter[City][id]={{Id}}' to the path)   
However, this example is only used to show that communication is possible. This can be certainly adjusted and rewritten to fit general cases, but exceeds this example's use.
