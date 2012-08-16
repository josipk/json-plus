JSON Plus
=============

JSONplus is regular JSON data format extended with functions as data type. 
Such format is in fact JavaScript Object Literal without variable declaration.
Function as a data type in JSON format is not approved by "json.org"!


Usage
-----

	You can load JSONplus source from external file using ajax:

        var obj = jsonPlus.get('source.json');
				
	or You can simply parse JSONplus string source:

            var obj = jsonPlus.parse(
					'{"title": "JSONplus",
                    "foo": function (a, b){ 
                               alert(a + b); 
                           },
                    "array": [1,2,3,4,5]
                    "boolean":true}'
				);
				


Testing
-------
	
	Download "jsonplus.zip" for testing purpose.
	Open "index.html" in Your browser.


More Info
---------

[JsonPlus.com](http://jsonplus.com/)