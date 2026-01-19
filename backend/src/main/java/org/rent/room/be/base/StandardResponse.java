package org.rent.room.be.base;

import lombok.*;
import lombok.experimental.SuperBuilder;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class StandardResponse<T>{
   @Builder.Default
    private  int code = 1000 ;
    private String message;
    private T result;

}
