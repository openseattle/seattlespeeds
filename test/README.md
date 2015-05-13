# Mocha testing in SEANetMap

The main test process documentation is at:  
https://github.com/codeforseattle/seanetmap/wiki/Test-processes

## Test style
Test is done as follows:
- Testing framework is Mocha
- Assertion library is Must.js
- Client side HTTP test doubling via SinonJS
- Server side HTTP test doubling via Nock

All of the above are pulled in via package.json during `npm install`

This directory is called `test` because that is where Mocha looks by default, and defaults mean less typing.

### No chai please
Notice that the assertion library is NOT chai and NOT should.js even.though.all.the.cool.kids.are.doing.it, because those are irresponsibly designed by Ruby refugees. See the following for more chai hate:
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/chai

### Test style examples
See the following examples for how test will be done
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/mocha
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/must
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/sinon

## Actual testing
For performance all "statics" will be hosted on a CDN. This includes the JSON files (GeoJSON and TopoJSON).

### Seattle as test case
One of the long term goals is to have this codebase be easily deployed anywhere, for any locality.
As such it should not be Seattle specific in its core. 
Seattle is simply the first place it is being deployed.
In other words, Seattle can be seen as the test case and the broadband performance maps of Seattle as test data.
As such those maps are parked here in a sub-directory called `seattle-perf-maps`.

It takes some time to generate the maps so there a sample set pre-generated and included in the git repo
so that folks can just clone the repo and then instantly run the server.


