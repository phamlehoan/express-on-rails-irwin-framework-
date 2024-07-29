import courseData from "@models/faker/courses.json";
import { Request, Response } from "express";
import { ApplicationController } from "../application.controller";

export class CourseController extends ApplicationController {
  public index(req: Request, res: Response) {
    const courses = courseData;
    res.render("course.view/index", { courses: courses });
  }
}
