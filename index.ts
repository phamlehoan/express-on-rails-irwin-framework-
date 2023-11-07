import application from "@configs/application";

// Export handler to serverless
module.exports.handler = application.handler();

// Run the serverfull
application.run();
