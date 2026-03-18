// Chỉ export các channel cụ thể (concrete classes), không export abstract ApplicationChannel
// vì Application.ts sẽ lặp qua object này để khởi tạo instance.
export * from "./chat.channel";
