package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.comment.CommentResponse;
import org.rent.room.be.entity.Comment;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(target = "authorId", source = "author.userId")
    @Mapping(target = "authorName", source = "author.userName")
    @Mapping(target = "parentCommentId", source = "parentComment.commentId")
    CommentResponse toResponse(Comment comment);

    List<CommentResponse> toResponseList(List<Comment> comments);
}
