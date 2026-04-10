import { HomePageValidator } from "@validators/common.validator";
import { ApplicationController } from ".";

export class HomeController extends ApplicationController {
  async index() {
    const data = await this.params(HomePageValidator).permit(
      "currentPage",
      "pageSize",
    );
    const { currentPage = 1, pageSize = 10 } = data;

    this.render("home.view/index", {
      title: "Home Page",
      currentPage,
      pageSize,
    });
  }
}
