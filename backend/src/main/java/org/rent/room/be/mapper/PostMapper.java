package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.post.PostResponse;
import org.rent.room.be.entity.Post;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mapping(target = "authorId", source = "author.userId")
    @Mapping(target = "authorName", source = "author.userName")
    @Mapping(target = "authorRole", source = "author.role.roleName")
    @Mapping(target = "comments", ignore = true)
    PostResponse toResponse(Post post);

    List<PostResponse> toResponseList(List<Post> posts);
}
