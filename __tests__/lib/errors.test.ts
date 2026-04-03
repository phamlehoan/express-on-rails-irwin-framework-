import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "@rails/errors";

describe("Errors", () => {
  it("BadRequestError has status 400", () => {
    const err = new BadRequestError("Invalid");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Invalid");
  });

  it("NotFoundError has status 404", () => {
    const err = new NotFoundError("User not found");
    expect(err.statusCode).toBe(404);
  });

  it("UnauthorizedError has status 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it("ForbiddenError has status 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it("UnprocessableEntityError has errors", () => {
    const err = new UnprocessableEntityError("Validation failed", {
      email: ["is invalid"],
    });
    expect(err.statusCode).toBe(422);
    expect(err.errors).toEqual({ email: ["is invalid"] });
  });
});
