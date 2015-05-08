# Mocha testing in SEANetMap

The main test process documentation is at:  
https://github.com/codeforseattle/seanetmap/wiki/Test-processes

Test is done as follows:
- Testing framework is Mocha
- Assertion library is Must.js
- Client side HTTP test doubling via SinonJS
- Server side HTTP test doubling via Nock

All of the above are pulled in via package.json during `nmp install`

This directory is called `test` because that is where Mocha looks by default, and defaults mean less typing.

## No chai please
Assertion library is NOT chai and NOT should.js because those are irresponsibly designed. See the following for more chai hate:
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/chai

## Examples
See the following examples for how test will be done
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/mocha
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/must
- https://github.com/JohnTigue/nodeio/tree/master/src/explorations/sinon