import { IsNotEmpty, IsString, MaxLength, validate } from "class-validator";
import { ApplicationChannel } from "./application.channel";

class ChatMessageValidator {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;
}

export class ChatChannel extends ApplicationChannel {
  async subscribe() {
    // Đảm bảo chỉ user đã đăng nhập mới có thể tham gia chat
    if (!(await this.ensureAuthenticated())) return;

    // Client join vào room 'chat_room'
    this.join("chat_room");

    // Lắng nghe sự kiện 'chat:message' từ client
    this.socket.on("chat:message", (data: unknown) => this.handleMessage(data));
  }

  private async handleMessage(data: unknown) {
    const message = new ChatMessageValidator();
    message.content = (data as Record<string, string>)?.content || "";

    const user = await this.getCurrentUser();
    const errors = await validate(message);
    if (errors.length > 0 || !user) {
      console.error("[ChatChannel] Invalid message or unauthenticated user", {
        data,
        errors,
      });
      return; // Không broadcast message không hợp lệ
    }

    // Broadcast lại cho tất cả client trong room (trừ sender)
    this.broadcastTo("chat_room", "chat:message", {
      user: { id: user.id, name: `${user.firstName} ${user.lastName}` },
      content: message.content,
      timestamp: new Date().toISOString(),
    });
  }
}
