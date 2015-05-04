# SEANetMap
Broadband Comparison Tool for Seattle

SEANetMap is a join project between M-Labs and Code for Seattle with the goal of
developing an open source codebase for citizens to run broadband network performance tests
and compare their results with what others are experiencing across an area
and/or network providers. The aggregate results dataset is publicly available
as a social good for further analysis. Initially, the project will be specific
to Seattle, yet it is a goal to make the codebase reusable in other localities.



## Getting started developing
These instructions assume that [Node.js and npm](http://blog.nodeknockout.com/post/65463770933/how-to-install-node-js-and-npm) are installed on the dev machine.

From the command line:
- clone the repository in one of the two normal ways, as you like:
  - `git clone git@github.com:codeforseattle/seanetmap.git`
  - `git clone https://github.com/codeforseattle/seanetmap.git`	
- `cd` into the repo just copied
- `npm install` to install all of the necessary dependencies
- `./setup-db.js` to create a sqlite database in `db/`
- `node server` to start the Node.js server
- in a browser visit http://localhost:8000

Further, more detailed information can be found in the [Developer guide](https://github.com/codeforseattle/seanetmap/wiki/Developer-guide) page in this project's wiki.

## More info
Check [the wiki](https://github.com/codeforseattle/seanetmap/wiki) for much more info.

[The deployment guide](https://github.com/codeforseattle/seanetmap/wiki/Deployment-guide) 
is intended for people interested in deploying the codebase, without necessarily contributing new code
to the project.