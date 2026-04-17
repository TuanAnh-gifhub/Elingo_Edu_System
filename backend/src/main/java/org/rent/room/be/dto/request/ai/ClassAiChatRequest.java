package org.rent.room.be.dto.request.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassAiChatRequest {

	@NotBlank(message = "message is required")
	String message;
}


