import { loadDotenv } from "./configs/loadDotenv";
loadDotenv();

import "module-alias/register";

import application from "@configs/application";

application.run();
