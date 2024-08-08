import application from "@configs/application";
import env from "@configs/env";

// To filter routes. use:
//  - CMD:  set S='YOUR SEARCH TEXT' && yarn routes
//  - BASH: export S='YOUR SEARCH TEXT' && yarn routes
console.info("ROUTES:\n");
application.showRoutes(env.search);
