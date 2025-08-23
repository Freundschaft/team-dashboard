# Team Dashboard

A full-stack team management web application built with Next.js, PostgreSQL, and TypeScript. Features hierarchical team structures with member management capabilities.

disclaimer: claude code was used to generate boilerplate code

## Setup

1. Clone from repository
2. run npm/yarn install
3. set environment variable through POSTGRES_URL or POSTGRES_USER, POSTGRES_HOST, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_PORT, or .env containing these values
4. run db initialization with npm run db-init
5. start with npm run dev / start

## Design / Technical Decisions

* use nextjs, since its also a SSR framework
* Put data retrieval logic for main page in API calls, for faster page load only render main page server side, and utilizing loader to fetch team data afterwards
* For Team Edit Page, we can use SSR to prerender the data on the server and eliminate one API call from the client
* Use pg for postgres direct access
* Team table to hold team information name, metadata and parentId, each team can only have 1 parent, but any amount of children
* User table to hold information about user name and email, (possibly metadata for future consideration)
* Team_Members table to hold relationship information between team and users. A user can be a member of multiple teams. Membership can be active or inactive.
* Membership role can differ throughput different teams, e.g. a user can be lead role in one team, but contributor role in another.
* This way, when a team hierarchy changes through selection of a new parent, all users are implicitly moved to the new parent and inherent parent membership.
* Users can be both explicit members of a team, or inherited through child team membership

## Query design decisions

* Aggregate parent child relationships in postgres for higher performance, add trigger function to avoid circular references between teams
* Aggregate team membership directly in postgres into JSON array, for easier usage and higher performance, marking direct members of a team, as opposed to inherited members

## Production Deployment considerations

* double check sanitization, possibility of injections, rate limiting
* double check error handling, and output user-friendly and secure error messages
* limit maximum nesting level of teams and amount of users in teams
* adjust ui for large amount of teams / user, consider pagination if necessary
* ~~it is not possible yet to add new users in the UI, if this application would be the primary source for users this would need to be added~~
* it is not possible yet to add new teams
* at the moment the application doesnt implement any kind of login, for production this would be obviously required.
* an audit log including, who changed what and when would also be required, and possibly an undo feature, if any team changes were to be reverted / historical storage of changes
* caching should be tuned, at the moment nextjs standard caching configuration is used
* postgres connection should be tuned, performances of queries should be measured and optimized, depending on production environment, considerations regarding serverless and connection pooling should be made
* docker image creation should be added
* UI is obviously very basic, and would need a lot of improvement
* Tests are obviously very basic and would need a lot of expansion
