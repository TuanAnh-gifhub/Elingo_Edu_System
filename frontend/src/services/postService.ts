// Mock service cho template giao diện - không cần API thật
// Khi có API thật, thay thế file này bằng service thực tế

// Post Status Constants
export const PostStatus = {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

export type PostStatusType = typeof PostStatus[keyof typeof PostStatus];

// Post Interface
export interface Post {
    postId: string;
    title: string;
    content: string;
    postStatus: string;
    postUserName?: string;
    commentOnPost?: string;
    emotion?: string;
    totalVote?: number;
    rentalAreaId?: string;
    userId: string;
    createdAt?: string;
    updatedAt?: string;
    mediaList?: Media[];
}

export interface Media {
    mediaId: string;
    mediaUrl: string;
    mediaType: string;
}

// Request DTOs
export interface CreatePostRequest {
    title: string;
    content: string;
    postStatus?: string;
    rentalAreaId?: string;
    mediaUrls?: string[];
}

export interface UpdatePostRequest {
    title?: string;
    content?: string;
    postStatus?: string;
    rentalAreaId?: string;
    mediaUrls?: string[];
}

export interface PostFilterParams {
    page?: number;
    size?: number;
    status?: string;
    keyword?: string;
}

// Mock response types
interface MockApiResponse<T> {
    code: number;
    message: string;
    result: T;
}

interface MockPageResponse<T> {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
    data: T[];
}

// Mock data
const mockPosts: Post[] = [
    {
        postId: "1",
        title: "Phòng học rộng rãi tại trung tâm",
        content: "Phòng học đầy đủ tiện nghi, có máy lạnh, bàn ghế mới, phù hợp cho nhóm học tập từ 5-10 người. Giá cả hợp lý, vị trí thuận tiện.",
        postStatus: PostStatus.APPROVED,
        totalVote: 5,
        userId: "user1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        postId: "2",
        title: "Phòng học yên tĩnh gần trường",
        content: "Phòng học yên tĩnh, có wifi tốc độ cao, phù hợp cho học nhóm hoặc làm việc. Giá thuê theo giờ hoặc theo ngày.",
        postStatus: PostStatus.PENDING,
        totalVote: 0,
        userId: "user1",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

// Mock service - chỉ để demo giao diện
export const postService = {
    // Lấy danh sách tin đăng của user hiện tại
    getMyPosts: async (
        page: number = 1,
        size: number = 10,
        status?: string,
        keyword?: string
    ): Promise<{ data: MockApiResponse<MockPageResponse<Post>> }> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let filteredPosts = [...mockPosts];

        // Filter by status
        if (status) {
            filteredPosts = filteredPosts.filter(post => post.postStatus === status);
        }

        // Filter by keyword
        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            filteredPosts = filteredPosts.filter(
                post =>
                    post.title.toLowerCase().includes(lowerKeyword) ||
                    post.content.toLowerCase().includes(lowerKeyword)
            );
        }

        // Pagination
        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

        const pageResponse: MockPageResponse<Post> = {
            currentPage: page,
            totalPages: Math.ceil(filteredPosts.length / size),
            pageSize: size,
            totalElements: filteredPosts.length,
            data: paginatedPosts,
        };

        return {
            data: {
                code: 200,
                message: "Success",
                result: pageResponse,
            },
        };
    },

    // Lấy chi tiết một tin đăng
    getPostById: async (postId: string): Promise<{ data: MockApiResponse<Post> }> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const post = mockPosts.find(p => p.postId === postId);

        if (!post) {
            throw new Error("Post not found");
        }

        return {
            data: {
                code: 200,
                message: "Success",
                result: post,
            },
        };
    },

    // Tạo tin đăng mới
    createPost: async (data: CreatePostRequest): Promise<{ data: MockApiResponse<Post> }> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newPost: Post = {
            postId: Date.now().toString(),
            title: data.title,
            content: data.content,
            postStatus: data.postStatus || PostStatus.DRAFT,
            userId: "current-user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        mockPosts.unshift(newPost);

        return {
            data: {
                code: 200,
                message: "Tạo tin đăng thành công",
                result: newPost,
            },
        };
    },

    // Cập nhật tin đăng
    updatePost: async (postId: string, data: UpdatePostRequest): Promise<{ data: MockApiResponse<Post> }> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const index = mockPosts.findIndex(p => p.postId === postId);
        if (index === -1) {
            throw new Error("Post not found");
        }

        const updatedPost: Post = {
            ...mockPosts[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        mockPosts[index] = updatedPost;

        return {
            data: {
                code: 200,
                message: "Cập nhật tin đăng thành công",
                result: updatedPost,
            },
        };
    },

    // Xóa tin đăng
    deletePost: async (postId: string): Promise<{ data: MockApiResponse<void> }> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const index = mockPosts.findIndex(p => p.postId === postId);
        if (index === -1) {
            throw new Error("Post not found");
        }

        mockPosts.splice(index, 1);

        return {
            data: {
                code: 200,
                message: "Xóa tin đăng thành công",
                result: undefined as void,
            },
        };
    },

    // Thay đổi trạng thái tin đăng
    updatePostStatus: async (postId: string, status: string): Promise<{ data: MockApiResponse<Post> }> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const index = mockPosts.findIndex(p => p.postId === postId);
        if (index === -1) {
            throw new Error("Post not found");
        }

        const updatedPost: Post = {
            ...mockPosts[index],
            postStatus: status,
            updatedAt: new Date().toISOString(),
        };

        mockPosts[index] = updatedPost;

        return {
            data: {
                code: 200,
                message: "Cập nhật trạng thái thành công",
                result: updatedPost,
            },
        };
    },
};
