import models from "@models";

/**
 * Base Service - tương tự Service Objects trong Rails.
 * Chứa business logic tách khỏi controller.
 */
export abstract class ApplicationService {
  protected get models() {
    return models;
  }
}
