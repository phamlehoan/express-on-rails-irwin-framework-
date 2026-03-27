import { ApplicationController } from ".";

export class HomeController extends ApplicationController {
  async index() {
    console.log("HomeController index called");
    // const data = await this.params(HomePageValidator).permit(
    //   "currentPage",
    //   "pageSize",
    // );
    // const { currentPage = 1, pageSize = 10 } = data;

    console.log("Sending response");
    this.res.send("Hello World");
  }
}
