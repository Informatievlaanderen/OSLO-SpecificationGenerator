# an input file (for the test case we make one)
wget https://github.com/Informatievlaanderen/duet-generated/raw/master/report/doc/applicationprofile/sdg-ap/all-sdgmodels2-ap.jsonld -N
# the output of the html-generator
wget https://github.com/Informatievlaanderen/duet-generated/raw/master/report/doc/applicationprofile/sdg-ap/html-nj_en.json -N

echo "testing class https://sdg.semic-euAddress"

DEFINITIONCLASSJSONLD=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.definition' all-sdgmodels2-ap.jsonld)
DEFINITIONCLASSJSON=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.definition' html-nj_en.json)
if [ ${DEFINITIONCLASSJSONLD} != ${DEFINITIONCLASSJSON} ]; 
then 
    echo "Definitions for https://sdg.semic-euAddress not equal"; 
    exit -1;
fi

USAGECLASSJSONLD=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.usage' all-sdgmodels2-ap.jsonld)
USAGECLASSJSON=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.usage' html-nj_en.json)
if [ ${USAGECLASSJSONLD} != ${USAGECLASSJSON} ]; 
then 
    echo "Usages for https://sdg.semic-euAddress not equal"; 
    exit -1;
fi

PARENTCLASSJSONLD=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.parents' all-sdgmodels2-ap.jsonld)
PARENTCLASSJSON=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.parents' html-nj_en.json)
if [ ${PARENTCLASSJSONLD} != ${PARENTCLASSJSON} ]; 
then 
    echo "Parents for https://sdg.semic-euAddress not equal"; 
    exit -1;
fi

NAMECLASSJSONLD=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.name' all-sdgmodels2-ap.jsonld)
NAMECLASSJSON=$(jq '.classes[] | select(."@id" == "https://sdg.semic-euAddress" )|.name' html-nj_en.json)
if [ ${NAMECLASSJSONLD} != ${NAMECLASSJSON} ]; 
then 
    echo "Names for https://sdg.semic-euAddress not equal"; 
    exit -1;
fi

echo "Testing of class https://sdg.semic-euAddress concluded"
echo "Testing of property https://sdg.semic-euAddress.address concluded"

DEFINITIONPROPERTYJSONLD=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.definition' all-sdgmodels2-ap.jsonld)
DEFINITIONPROPERTYJSON=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.definition' html-nj_en.json)
if [ ${DEFINITIONPROPERTYJSONLD} != ${DEFINITIONPROPERTYJSON} ];
then
    echo "Definitions for https://sdg.semic.euAddress.address not equal";
    exit -1;
fi

USAGEPROPERTYJSONLD=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.usage' all-sdgmodels2-ap.jsonld)
USAGEPROPERTYJSON=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.usage' html-nj_en.json)
if [ ${USAGEPROPERTYJSONLD} != ${USAGEPROPERTYJSON} ];
then
    echo "Usages for https://sdg.semic.euAddress.address not equal";
    exit -1;
fi

PARENTPROPERTYJSONLD=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.parents' all-sdgmodels2-ap.jsonld)
PARENTPROPERTYJSON=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.parents' html-nj_en.json)
if [ ${PARENTPROPERTYJSONLD} != ${PARENTPROPERTYJSON} ];
then
    echo "Parents for https://sdg.semic.euAddress.address not equal";
    exit -1;
fi

NAMEPROPERTYJSONLD=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.name' all-sdgmodels2-ap.jsonld)
NAMEPROPERTYJSON=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.name' html-nj_en.json)
if [ ${NAMEPROPERTYJSONLD} != ${NAMEPROPERTYJSON} ];
then
    echo "Names for https://sdg.semic.euAddress.address not equal";
    exit -1;
fi

RANGEPROPERTYJSONLD=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.range' all-sdgmodels2-ap.jsonld)
RANGEPROPERTYJSON=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.range' html-nj_en.json)
if [ ${RANGEPROPERTYJSONLD} != ${RANGEPROPERTYJSON} ];
then
    echo "Ranges for https://sdg.semic.euAddress.address not equal";
    exit -1;
fi

DOMAINPROPERTYJSONLD=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.domain' all-sdgmodels2-ap.jsonld)
DOMAINPROPERTYJSON=$(jq '.properties[] | select(."@id" == "https://sdg.semic.euAddress.address" )|.domain' html-nj_en.json)
if [ ${DOMAINPROPERTYJSONLD} != ${DOMAINPROPERTYJSON} ];
then
    echo "Domains for https://sdg.semic.euAddress.address not equal";
    exit -1;
fi

echo "testing of property https://sdg.semic-euAddress.address concluded"

echo "The values were transfered correctly";
exit 1;