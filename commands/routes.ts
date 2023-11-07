import application from "@configs/application";

// To filter routes. use:
//  - CMD:  set S='YOUR SEARCH TEXT' && yarn routes
//  - BASH: export S='YOUR SEARCH TEXT' && yarn routes
console.info("ROUTES:\n");
application.showRoutes(process.env.S);
