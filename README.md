# SeattleSpeeds
SeattleSpeeds is web-based technology for communal situational awareness of the broadband network environment.

## Demo
The code is demo'd live at http://seattlegig.net

(Note that the domain name seattlegig.net has no official connotations associated with it. It is simply a domain at which to demo the code.)

## Introduction

SeattleSpeeds is a joint project between M-Labs and Code for Seattle with the goal of

- producing a liberally licensed, widely deployable, open source codebase for
- crowdsourced broadband network performance test reports that
- provides a community situation awareness of broadband network status within an area and/or network provider so that
- individuals can compare their current and historical results with that of their fellow citizens

The aggregate results dataset is publicly available as a social good for further analysis. 

The code is being developed and deployed in Seattle first, yet it is a goal for the codebase to be easily redeployed for other localities.

## Getting started developing
These instructions assume that [Node.js and npm](http://blog.nodeknockout.com/post/65463770933/how-to-install-node-js-and-npm) are installed on the dev machine.

From the command line:
- clone the repository in one of the two normal ways, as you like:
  - `git clone git@github.com:openseattle/seattlespeeds.git`
  - `git clone https://github.com/openseattle/seattlespeeds.git`	
- `cd` into the repo just copied
- `npm install` to install all of the necessary dependencies
- `./setup-db.js` to create a sqlite database in `db/`
- `node server` to start the Node.js server
- in a browser visit http://localhost:8000

More detailed information can be found in the [Developer guide](https://github.com/openseattle/seattlespeeds/wiki/Developer-guide) page in this project's wiki.

## More info
Check [the wiki](https://github.com/openseattle/seattlespeeds/wiki) for much more info.

[The deployment guide](https://github.com/openseattle/seattlespeeds/wiki/Deployment-guide) 
is intended for people interested in deploying the codebase, without necessarily contributing new code
to the project.